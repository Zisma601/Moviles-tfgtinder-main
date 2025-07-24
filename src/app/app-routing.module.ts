import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '', // Ruta base
    redirectTo: 'login', // Redirige a la página de login al inicio
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'tfg-prof',
    loadChildren: () => import('./tfg-prof/tfg-prof.module').then(m => m.TfgProfPageModule)
  },
  {
    path: 'descubre-alum',
    loadChildren: () => import('./descubre-alum/descubre-alum.module').then( m => m.DescubreAlumPageModule)
  },
  {
    path: 'msg-alumno',
    loadChildren: () => import('./msg-alumno/msg-alumno.module').then( m => m.MsgAlumnoPageModule)
  },
  {
    path: 'matches',
    loadChildren: () => import('./matches/matches.module').then( m => m.MatchesPageModule)
  },
  {
    path: 'msg-prof',
    loadChildren: () => import('./msg-prof/msg-prof.module').then( m => m.MsgProfPageModule)
  },
  {
    path: 'perfil-alum',
    loadChildren: () => import('./perfil-alum/perfil-alum.module').then( m => m.PerfilAlumPageModule)
  },
  {
    path: 'perfil-prof',
    loadChildren: () => import('./perfil-prof/perfil-prof.module').then( m => m.PerfilProfPageModule)
  },
  {
    path: 'chat-alum',
    loadChildren: () => import('./chat-alum/chat-alum.module').then( m => m.ChatAlumPageModule)
  },
  {
    path: 'chat-prof',
    loadChildren: () => import('./chat-prof/chat-prof.module').then( m => m.ChatProfPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
