import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, from } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase.config';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> {
    return this.authService.getCurrentUser().pipe(
      take(1),
      switchMap((user) => {
        if (!user) {
          return from([
            this.router.createUrlTree(['/app/login'], {
              queryParams: { returnUrl: state.url },
            }),
          ]);
        }

        return from(getDoc(doc(firestore, `users/${user.uid}`))).pipe(
          map((snapshot) => {
            const hasPaidAccess = snapshot.exists() && snapshot.data()?.['pixAccessGranted'] === true;
            return hasPaidAccess ? true : this.router.parseUrl('/app/billing');
          }),
        );
      }),
    );
  }
}
