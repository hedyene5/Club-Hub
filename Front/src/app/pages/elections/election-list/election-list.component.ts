import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ElectionService } from '../../../services/election.service';
import { Election } from '../../../models/election.model';

@Component({
  selector: 'app-election-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './election-list.component.html',
  styleUrls: ['./election-list.component.css']
})
export class ElectionListComponent implements OnInit {
  elections: Election[] = [];
  loading = true;

  constructor(private electionService: ElectionService) {}

  ngOnInit(): void {
    this.loadElections();
  }

  loadElections(): void {
    this.electionService.getAllElections().subscribe({
      next: (data) => {
        this.elections = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
      }
    });
  }

  deleteElection(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette élection ?')) {
      this.electionService.deleteElection(id).subscribe({
        next: () => {
          this.elections = this.elections.filter(e => e.id !== id);
        },
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'PLANNED': return 'bg-yellow-100 text-yellow-800';
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'PLANNED': return 'Planifiée';
      case 'OPEN': return 'En cours';
      case 'CLOSED': return 'Clôturée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  }
}