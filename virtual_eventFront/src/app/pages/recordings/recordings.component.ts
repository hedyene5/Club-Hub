import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecordService } from '../../shared/services/record.service';

@Component({
  selector: 'app-recordings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recordings.component.html'
})
export class RecordingsComponent implements OnInit {

  records: any[] = [];
  selectedFile!: File;
  isLoading = false;

  constructor(private recordService: RecordService) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  // 🔄 LOAD RECORDS + TRANSCRIPTIONS
  loadRecords() {
    this.recordService.getAllRecords().subscribe({
      next: (data) => {
        this.records = data;

        this.records.forEach(record => {
          this.recordService.getTranscriptions(record.id)
            .subscribe(ts => {
              if (ts.length > 0) {
                record.transcription = ts[0];
              }
            });
        });
      },
      error: (err) => console.error(err)
    });
  }

  // 📤 SELECT FILE
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;
    this.upload();
  }

  // 🚀 UPLOAD + TRANSCRIBE
  upload() {

    if (!this.selectedFile) {
      alert("Choisir un fichier");
      return;
    }

    this.isLoading = true;

    const record = {
      fileUrl: "temp",
      gdprConsent: true,
      virtualEvent: null
    };

    this.recordService.createRecord(record).subscribe({
      next: (created) => {

        this.recordService.transcribe(created.id, this.selectedFile)
          .subscribe({
            next: () => {
              alert("✅ Transcription réussie !");
              this.isLoading = false;
              this.loadRecords();
            },
            error: () => {
              alert("❌ erreur transcription");
              this.isLoading = false;
            }
          });

      },
      error: () => {
        alert("❌ erreur création record");
        this.isLoading = false;
      }
    });
  }

  // ▶️ PLAY AUDIO
  play(record: any) {
    if (record.fileUrl) {
      window.open(record.fileUrl, '_blank');
    } else {
      alert("Pas d’audio disponible");
    }
  }

  // 🗑 DELETE
  delete(id: string) {
    if (!confirm("Supprimer ?")) return;

    this.recordService.deleteRecord(id).subscribe(() => {
      this.records = this.records.filter(r => r.id !== id);
    });
  }

  // 📄 PDF DOWNLOAD
  downloadPdf(recordId: string) {
    this.recordService.downloadPdf(recordId).subscribe({
      next: (blob: Blob) => {

        if (blob.size === 0) {
          alert("❌ PDF vide !");
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transcription.pdf';
        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert("❌ erreur téléchargement PDF");
      }
    });
  }
}