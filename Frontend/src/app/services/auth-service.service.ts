import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from "../../../backend/models/userModel.js"



@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  constructor(private http: HttpClient) { }

  
}
