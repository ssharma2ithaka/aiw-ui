import { Routes, RouterModule } from '@angular/router';
import { Home } from './home';
import { SearchPage } from './search-page';
import { CollectionPage } from './collection-page';
import { ImageGroupPage } from './image-group-page';
import { Login } from './login';
import { About } from './about';
import { NoContent } from './no-content';
import { AuthService } from './shared/auth.service';

import { DataResolver } from './app.resolver';


export const ROUTES: Routes = [
  { path: '',      component: Home, canActivate:[AuthService] },
  { path: 'login', component: Login },
  { path: 'home',  component: Home, canActivate:[AuthService] },
  { path: 'search', component: SearchPage, canActivate:[AuthService] },
  { path: 'collection', component: CollectionPage, canActivate:[AuthService] },
  { path: 'image-group', component: ImageGroupPage, canActivate:[AuthService]},
  { path: 'about', component: About },
  { path: '**',    component: NoContent },
];
