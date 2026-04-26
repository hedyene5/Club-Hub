import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-event-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mt-8 p-5 bg-gradient-to-br from-amber-50 to-white rounded-2xl shadow-lg border border-amber-200">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span class="text-2xl">📍</span> Localisation de l'événement
        </h3>
        <div class="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
          {{ distance ? '📍 Distance calculée' : '🗺️ Carte interactive' }}
        </div>
      </div>
      <div id="eventMap" class="w-full rounded-xl overflow-hidden border-2 border-amber-300 shadow-md" style="height: 500px;"></div>
      <div *ngIf="distance" class="mt-4 p-3 bg-amber-100 rounded-xl flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🚗</span>
          <span class="font-medium text-gray-700">Distance depuis votre position :</span>
        </div>
        <div class="text-2xl font-bold text-amber-700">{{ distance }} km</div>
      </div>
      <div *ngIf="errorMessage" class="mt-4 p-3 bg-red-100 rounded-xl text-red-700 text-sm flex items-center gap-2">
        <span>⚠️</span> {{ errorMessage }}
      </div>
      <div class="mt-3 text-xs text-gray-500 text-center border-t border-amber-100 pt-3">
        🌍 Carte interactive – cliquez pour zoomer | 📍 Votre position (si autorisé) | 📍 Lieu de l'événement
      </div>
    </div>
  `
})
export class EventMapComponent implements OnInit, AfterViewInit {
  @Input() venue: string = '';
  private map: L.Map | undefined;
  private eventLat: number | null = null;
  private eventLon: number | null = null;
  distance: string = '';
  errorMessage: string = '';

  ngOnInit() {
    console.log('EventMapComponent initialized, venue:', this.venue);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  private initMap() {
    if (!this.venue) {
      this.errorMessage = 'Adresse de l’événement non fournie.';
      return;
    }

    const mapElement = document.getElementById('eventMap');
    if (!mapElement) {
      this.errorMessage = 'Erreur: conteneur de carte introuvable.';
      return;
    }

    try {
      this.map = L.map('eventMap').setView([36.8065, 10.1815], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
      console.log('Map created successfully');
    } catch (err) {
      console.error('Leaflet error:', err);
      this.errorMessage = 'Erreur d’initialisation de la carte.';
      return;
    }

    this.geocodeVenue();
  }

  private geocodeVenue() {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.venue)}&limit=1`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          this.eventLat = parseFloat(data[0].lat);
          this.eventLon = parseFloat(data[0].lon);
          this.map?.setView([this.eventLat, this.eventLon], 13);
          L.marker([this.eventLat, this.eventLon]).addTo(this.map!)
            .bindPopup(`<b>${this.venue}</b>`)
            .openPopup();
          this.getUserLocation();
        } else {
          this.errorMessage = `Lieu introuvable : "${this.venue}". Essayez une adresse plus précise.`;
        }
      })
      .catch(() => {
        this.errorMessage = 'Erreur de connexion au service de géolocalisation.';
      });
  }

  private getUserLocation() {
    if (!navigator.geolocation) {
      this.errorMessage = 'La géolocalisation n’est pas supportée par votre navigateur.';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        L.marker([userLat, userLon]).addTo(this.map!)
          .bindPopup('Votre position')
          .openPopup();
        if (this.eventLat !== null && this.eventLon !== null) {
          const bounds = L.latLngBounds([userLat, userLon], [this.eventLat, this.eventLon]);
          this.map?.fitBounds(bounds);
          const dist = this.calculateDistance(userLat, userLon, this.eventLat, this.eventLon);
          this.distance = dist.toFixed(1);
        }
      },
      (error) => {
        this.errorMessage = 'Impossible d’obtenir votre position. Autorisez la localisation.';
      }
    );
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}