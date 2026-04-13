import {
  Component, AfterViewInit, OnDestroy,
  ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface AvatarData {
  id: string;
  name: string;
  color: string;
  skinColor: string;
  hairColor: string;
}

interface PlayerState {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
}

interface ChatMessage {
  roomId: string;
  user: string;
  message: string;
}

@Component({
  selector: 'app-virtual-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './virtual-room.component.html',
  styleUrls: ['./virtual-room.component.css']
})
export class VirtualRoomComponent implements AfterViewInit, OnDestroy {

  @ViewChild('canvasContainer', { static: true }) container!: ElementRef;

  // Three.js
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  myAvatar!: THREE.Group;
  clock = new THREE.Clock();

  // Avatars des autres users: map userId -> THREE.Group
  otherAvatars: Map<string, THREE.Group> = new Map();

  // Contrôles
  keys: Record<string, boolean> = {};
  myId = 'user_' + Math.random().toString(36).substr(2, 9);
  avatarData!: AvatarData;

  // WebSocket STOMP
  stompClient!: Client;
  posSubscription?: StompSubscription;
  chatSubscription?: StompSubscription;

  // Chat
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  chatOpen = true;

  // State
  connected = false;
  roomId = 'room_main';

  ngAfterViewInit() {
    this.avatarData = JSON.parse(localStorage.getItem('avatar') || '{}');
    if (!this.avatarData.id) {
      this.avatarData = { id: 'default', name: 'Guest', color: '#4f8ef7', skinColor: '#FDBCB4', hairColor: '#3d2b1f' };
    }
    this.initScene();
    this.initControls();
    this.connectWebSocket();
    this.animate();
  }

  // ─── SCÈNE ───────────────────────────────────────────────────────────────────

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 15, 40);

    // Caméra
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 4, 8);
    this.camera.lookAt(0, 1, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.nativeElement.appendChild(this.renderer.domElement);

    // Lumières
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    this.scene.add(dirLight);

    // Lumière d'ambiance bleue/violette
    const pointLight1 = new THREE.PointLight(0x5533ff, 1.5, 15);
    pointLight1.position.set(-5, 3, -5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff3366, 1, 12);
    pointLight2.position.set(5, 3, -3);
    this.scene.add(pointLight2);

    this.buildRoom();
    this.buildFurniture();

    // Mon avatar
    this.myAvatar = this.createHumanAvatar(this.avatarData.color || '#4f8ef7');
    this.myAvatar.position.set(0, 0, 2);
    this.scene.add(this.myAvatar);

    // Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  buildRoom() {
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x16213e, side: THREE.BackSide });
    const room = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 16), wallMat);
    room.position.set(0, 3, 0);
    this.scene.add(room);

    // Sol parquet
    const floorTex = this.createFloorTexture();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 16),
      new THREE.MeshLambertMaterial({ map: floorTex })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Fenêtre (panneau lumineux)
    const windowGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 2.5),
      new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.3 })
    );
    windowGlow.position.set(-9.9, 3, -2);
    windowGlow.rotation.y = Math.PI / 2;
    this.scene.add(windowGlow);

    const windowFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.05, 2.5, 4)),
      new THREE.LineBasicMaterial({ color: 0x88ccff })
    );
    windowFrame.position.set(-9.9, 3, -2);
    this.scene.add(windowFrame);

    // Plafond lumineux
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 14),
      new THREE.MeshBasicMaterial({ color: 0x0d1117 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 5.99;
    this.scene.add(ceiling);

    // Strip LED au plafond
    const ledColors = [0x4444ff, 0xff44aa, 0x44ffaa];
    for (let i = 0; i < 3; i++) {
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(18, 0.05, 0.1),
        new THREE.MeshBasicMaterial({ color: ledColors[i] })
      );
      led.position.set(0, 5.9, -4 + i * 4);
      this.scene.add(led);
    }
  }

  buildFurniture() {
    // TABLE CENTRALE ronde
    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.12, 32),
      new THREE.MeshLambertMaterial({ color: 0x8B6914 })
    );
    tableTop.position.set(0, 0.86, 0);
    tableTop.castShadow = true;
    this.scene.add(tableTop);

    // Pied de table
    const tableLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.25, 0.85, 16),
      new THREE.MeshLambertMaterial({ color: 0x5a4010 })
    );
    tableLeg.position.set(0, 0.42, 0);
    this.scene.add(tableLeg);

    // ÉCRAN partagé
    const screenBase = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 2.2, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    screenBase.position.set(0, 2.5, -6.5);
    this.scene.add(screenBase);

    // Contenu de l'écran (glow)
    const screenContent = new THREE.Mesh(
      new THREE.PlaneGeometry(3.3, 2.0),
      new THREE.MeshBasicMaterial({ color: 0x1a3a6a })
    );
    screenContent.position.set(0, 2.5, -6.44);
    this.scene.add(screenContent);

    // Lignes UI sur l'écran
    const uiColors = [0x4488ff, 0xff6644, 0x44ff88];
    for (let i = 0; i < 3; i++) {
      const uiBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.25, 0.01),
        new THREE.MeshBasicMaterial({ color: uiColors[i] })
      );
      uiBlock.position.set(-0.9 + i * 0.9, 2.65, -6.43);
      this.scene.add(uiBlock);
    }

    // Pied écran
    const screenStand = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.8, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    screenStand.position.set(0, 1.5, -6.5);
    this.scene.add(screenStand);

    // CHAISES autour de la table
    const chairPositions = [
      { x: -3, z: 1.5, ry: 0.4 },
      { x: -1.5, z: 3, ry: 0 },
      { x: 1.5, z: 3, ry: -0.2 },
      { x: 3, z: 1, ry: -0.5 },
      { x: 3, z: -1.5, ry: -1 },
      { x: -3, z: -1.5, ry: 1 },
    ];
    chairPositions.forEach(p => {
      this.scene.add(this.createChair(p.x, p.z, p.ry));
    });

    // Keyboard sur table
    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.04, 0.3),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    keyboard.position.set(-1.5, 0.93, 0.5);
    this.scene.add(keyboard);
  }

  createChair(x: number, z: number, rotY: number): THREE.Group {
    const chair = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x2a6090 });

    // Siège
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.8), mat);
    seat.position.y = 0.5;
    chair.add(seat);

    // Dossier
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.06), mat);
    back.position.set(0, 0.9, -0.37);
    chair.add(back);

    // Pieds
    [[-0.35, -0.35], [-0.35, 0.35], [0.35, -0.35], [0.35, 0.35]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), mat);
      leg.position.set(lx, 0.25, lz);
      chair.add(leg);
    });

    chair.position.set(x, 0, z);
    chair.rotation.y = rotY;
    return chair;
  }

  // ─── AVATAR HUMANOÏDE ────────────────────────────────────────────────────────

  createHumanAvatar(color: string): THREE.Group {
    const group = new THREE.Group();
    const bodyColor = new THREE.Color(color);
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xFFCBA4 });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x3d2b1f });

    // Torse
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.28), bodyMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    group.add(torso);

    // Tête
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), skinMat);
    head.position.y = 1.82;
    head.castShadow = true;
    group.add(head);

    // Cheveux
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
    hair.position.y = 1.86;
    group.add(hair);

    // Yeux
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    [-0.08, 0.08].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
      eye.position.set(ex, 1.84, 0.2);
      group.add(eye);
    });

    // Cou
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.12, 8), skinMat);
    neck.position.y = 1.59;
    group.add(neck);

    // Bras gauche
    const lArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.45, 4, 8), bodyMat);
    lArm.position.set(-0.38, 1.2, 0);
    lArm.rotation.z = 0.15;
    group.add(lArm);

    // Bras droit
    const rArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.45, 4, 8), bodyMat);
    rArm.position.set(0.38, 1.2, 0);
    rArm.rotation.z = -0.15;
    group.add(rArm);

    // Mains
    [[-0.41, 0.92], [0.41, 0.92]].forEach(([hx, hy]) => {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), skinMat);
      hand.position.set(hx, hy, 0);
      group.add(hand);
    });

    // Jambes
    const legMat = new THREE.MeshLambertMaterial({ color: 0x1a1a3e });
    const lLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.55, 4, 8), legMat);
    lLeg.position.set(-0.16, 0.58, 0);
    group.add(lLeg);

    const rLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.55, 4, 8), legMat);
    rLeg.position.set(0.16, 0.58, 0);
    group.add(rLeg);

    // Pieds
    const footMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    [[-0.16, 0.07], [0.16, 0.07]].forEach(([fx, fz]) => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.22), footMat);
      foot.position.set(fx, 0.04, fz + 0.04);
      group.add(foot);
    });

    // Label nom flottant
    const label = this.createNameLabel(this.avatarData.name || 'Me');
    label.position.y = 2.2;
    group.add(label);

    return group;
  }

  createNameLabel(name: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, 128, 42);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.2, 0.3, 1);
    return sprite;
  }

  createFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#2a1f1a';
    ctx.lineWidth = 2;
    for (let i = 0; i < 512; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 3);
    return tex;
  }

  // ─── CONTRÔLES ───────────────────────────────────────────────────────────────

  initControls() {
    window.addEventListener('keydown', e => this.keys[e.key] = true);
    window.addEventListener('keyup', e => this.keys[e.key] = false);
  }

  movePlayer() {
    const speed = 0.07;
    let moved = false;

    if (this.keys['z'] || this.keys['w'] || this.keys['ArrowUp']) {
      this.myAvatar.position.z -= speed; moved = true;
    }
    if (this.keys['s'] || this.keys['ArrowDown']) {
      this.myAvatar.position.z += speed; moved = true;
    }
    if (this.keys['q'] || this.keys['a'] || this.keys['ArrowLeft']) {
      this.myAvatar.position.x -= speed;
      this.myAvatar.rotation.y = Math.PI / 2;
      moved = true;
    }
    if (this.keys['d'] || this.keys['ArrowRight']) {
      this.myAvatar.position.x += speed;
      this.myAvatar.rotation.y = -Math.PI / 2;
      moved = true;
    }

    // Limites de la salle
    this.myAvatar.position.x = Math.max(-9, Math.min(9, this.myAvatar.position.x));
    this.myAvatar.position.z = Math.max(-7, Math.min(7, this.myAvatar.position.z));

    // Animation marche (bras/jambes)
    if (moved) {
      const t = this.clock.getElapsedTime() * 6;
      const lArm = this.myAvatar.children[7] as THREE.Mesh;
      const rArm = this.myAvatar.children[8] as THREE.Mesh;
      if (lArm) lArm.rotation.x = Math.sin(t) * 0.4;
      if (rArm) rArm.rotation.x = -Math.sin(t) * 0.4;
    }

    // Caméra suit avatar (vue isométrique 3/4)
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.myAvatar.position.x, 0.08);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.myAvatar.position.z + 8, 0.08);
    this.camera.lookAt(this.myAvatar.position.x, 1.5, this.myAvatar.position.z);

    // Sync position WebSocket
    if (this.connected && moved) {
      this.sendPosition();
    }
  }

  // ─── WEBSOCKET ───────────────────────────────────────────────────────────────

  connectWebSocket() {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;

        // Écouter positions des autres
        this.posSubscription = this.stompClient.subscribe('/topic/positions', (msg) => {
          const state: PlayerState = JSON.parse(msg.body);
          if (state.id !== this.myId) {
            this.updateOtherAvatar(state);
          }
        });

        // Écouter chat
        this.chatSubscription = this.stompClient.subscribe('/topic/messages', (msg) => {
          const chatMsg: ChatMessage = JSON.parse(msg.body);
          this.chatMessages.push(chatMsg);
          if (this.chatMessages.length > 50) this.chatMessages.shift();
        });

        // Annoncer ma présence
        this.sendPosition();
      },
      onDisconnect: () => {
        this.connected = false;
      }
    });

    this.stompClient.activate();
  }

  sendPosition() {
    const state: PlayerState = {
      id: this.myId,
      name: this.avatarData.name || 'Guest',
      color: this.avatarData.color || '#4f8ef7',
      x: this.myAvatar.position.x,
      y: this.myAvatar.position.y,
      z: this.myAvatar.position.z,
      rotY: this.myAvatar.rotation.y
    };
    this.stompClient.publish({
      destination: '/app/position',
      body: JSON.stringify(state)
    });
  }

  updateOtherAvatar(state: PlayerState) {
    if (!this.otherAvatars.has(state.id)) {
      // Créer nouvel avatar
      const avatar = this.createHumanAvatar(state.color);
      this.scene.add(avatar);
      this.otherAvatars.set(state.id, avatar);
    }
    const avatar = this.otherAvatars.get(state.id)!;
    // Interpolation fluide
    avatar.position.x = THREE.MathUtils.lerp(avatar.position.x, state.x, 0.15);
    avatar.position.z = THREE.MathUtils.lerp(avatar.position.z, state.z, 0.15);
    avatar.rotation.y = state.rotY;
  }

  sendChat() {
    if (!this.chatInput.trim() || !this.connected) return;
    const msg: ChatMessage = {
      roomId: this.roomId,
      user: this.avatarData.name || 'Guest',
      message: this.chatInput.trim()
    };
    this.stompClient.publish({
      destination: '/app/chat',
      body: JSON.stringify(msg)
    });
    this.chatInput = '';
  }

  onChatKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.sendChat();
  }

  // ─── BOUCLE ───────────────────────────────────────────────────────────────────

  animate() {
    requestAnimationFrame(() => this.animate());
    this.movePlayer();
    this.renderer.render(this.scene, this.camera);
  }

  ngOnDestroy() {
    this.stompClient?.deactivate();
    this.renderer?.dispose();
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
  }
}