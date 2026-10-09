// Hồ sơ quản trị không chứa mật khẩu băm, token hay dữ liệu session.
export interface AdminUser {
  id:string; name:string; email:string; role:'customer'|'admin'; isActive:boolean;
  firebaseLinked:boolean; createdAt:string; orderCount:number;
}
