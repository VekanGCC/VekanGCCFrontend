import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User, UserAddress, UserBankDetails, UserStatutoryCompliance } from '../models/user.model';

export interface ProfileData {
  user: User;
  addresses: UserAddress[];
  bankDetails: UserBankDetails[];
  compliance: UserStatutoryCompliance | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profile`;
  private profileDataSubject = new BehaviorSubject<ProfileData | null>(null);
  public profileData$ = this.profileDataSubject.asObservable();

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ProfileData> {
    return this.http.get<{success: boolean, data: ProfileData}>(this.apiUrl).pipe(
      tap(response => {
        this.profileDataSubject.next(response.data);
      }),
      map(response => response.data)
    );
  }

  updateProfile(profileData: Partial<User>): Observable<User> {
    return this.http.put<{success: boolean, data: User}>(this.apiUrl, profileData).pipe(
      tap(response => {
        const currentData = this.profileDataSubject.value;
        if (currentData) {
          this.profileDataSubject.next({
            ...currentData,
            user: response.data
          });
        }
      }),
      map(response => response.data)
    );
  }

  changePassword(passwordData: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, passwordData);
  }

  deleteAccount(password: string): Observable<any> {
    return this.http.delete(this.apiUrl, { body: { password } });
  }

  // Address management
  addAddress(address: Omit<UserAddress, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Observable<UserAddress> {
    return this.http.post<{success: boolean, data: UserAddress}>(`${this.apiUrl}/addresses`, address).pipe(
      map(response => response.data)
    );
  }

  updateAddress(addressId: string, address: Partial<UserAddress>): Observable<UserAddress> {
    return this.http.put<{success: boolean, data: UserAddress}>(`${this.apiUrl}/addresses/${addressId}`, address).pipe(
      map(response => response.data)
    );
  }

  deleteAddress(addressId: string): Observable<any> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/addresses/${addressId}`);
  }

  // Bank details management (vendor only)
  addBankDetails(bankDetails: Omit<UserBankDetails, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Observable<UserBankDetails> {
    return this.http.post<{success: boolean, data: UserBankDetails}>(`${this.apiUrl}/bank-details`, bankDetails).pipe(
      map(response => response.data)
    );
  }

  updateBankDetails(bankDetailsId: string, bankDetails: Partial<UserBankDetails>): Observable<UserBankDetails> {
    return this.http.put<{success: boolean, data: UserBankDetails}>(`${this.apiUrl}/bank-details/${bankDetailsId}`, bankDetails).pipe(
      map(response => response.data)
    );
  }

  deleteBankDetails(bankDetailsId: string): Observable<any> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/bank-details/${bankDetailsId}`);
  }

  // Compliance management
  updateCompliance(compliance: Partial<UserStatutoryCompliance>): Observable<UserStatutoryCompliance> {
    return this.http.put<{success: boolean, data: UserStatutoryCompliance}>(`${this.apiUrl}/compliance`, compliance).pipe(
      map(response => response.data)
    );
  }

  clearProfileData(): void {
    this.profileDataSubject.next(null);
  }
} 