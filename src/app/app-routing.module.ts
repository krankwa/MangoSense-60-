import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'pages/loader',
    pathMatch: 'full'
  },
  {
    path: 'folder/:id',
    loadChildren: () => import('./folder/folder.module').then( m => m.FolderPageModule)
  },
  {
    path: 'pages/loader',
    loadChildren: () => import('./pages/loader/loader.module').then( m => m.LoaderPageModule)
  },
  {
    path: 'pages/home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'pages/detect',
    loadChildren: () => import('./pages/detect/detect.module').then( m => m.DetectPageModule)
  },
  {
    path: 'pages/results',
    loadChildren: () => import('./pages/results/results.module').then( m => m.ResultsPageModule)
  },
  {
    path: 'pages/verify',
    loadChildren: () => import('./pages/verify/verify.module').then( m => m.VerifyPageModule)
  },
  {
    path: 'pages/heatmap',
    loadChildren: () => import('./pages/heatmap/heatmap.module').then( m => m.HeatmapPageModule)
  },
  {
    path: 'pages/history',
    loadChildren: () => import('./pages/history/history.module').then( m => m.HistoryPageModule)
  },
  {
    path: 'pages/login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'pages/register',
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'pages/first-page',
    loadChildren: () => import('./pages/first-page/first-page.module').then( m => m.FirstPagePageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
