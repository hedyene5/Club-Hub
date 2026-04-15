import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'cstore-frontend';

  constructor(private router: Router) {}

  ngOnInit() {
    // Check for user data in URL
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    
    if (userParam) {
      // Save user data to localStorage
      const userData = JSON.parse(decodeURIComponent(userParam));
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Clean the URL (remove the user parameter)
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Redirect to products page
      this.router.navigate(['/products']);
    }
  }
}