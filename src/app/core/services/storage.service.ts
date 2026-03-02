import { Injectable } from '@angular/core';
import { ref, uploadBytes, getBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase.config';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor() {}

  // Upload de arquivo
  uploadFile(path: string, file: File): Observable<any> {
    const storageRef = ref(storage, path);
    return from(uploadBytes(storageRef, file));
  }

  // Download de arquivo
  downloadFile(path: string): Observable<ArrayBuffer> {
    const fileRef = ref(storage, path);
    return from(getBytes(fileRef));
  }

  // Deletar arquivo
  deleteFile(path: string): Observable<void> {
    const fileRef = ref(storage, path);
    return from(deleteObject(fileRef));
  }

  // Obter URL de download
  getDownloadURL(path: string): Observable<string> {
    const fileRef = ref(storage, path);
    return from(getDownloadURL(fileRef));
  }
}
