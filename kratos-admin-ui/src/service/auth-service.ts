export class AuthService {
  private static readonly ADMIN_USERNAME = "admin";
  private static readonly ADMIN_PASSWORD = "B1!EMqRMqX!Ac6ZQ7btf#QD4c4UH!MZz";
  private static readonly AUTH_KEY = "kratos_admin_auth";

  static login(username: string, password: string): boolean {
    if (
      username === this.ADMIN_USERNAME &&
      password === this.ADMIN_PASSWORD
    ) {
      sessionStorage.setItem(this.AUTH_KEY, "authenticated");
      return true;
    }
    return false;
  }

  static logout(): void {
    sessionStorage.removeItem(this.AUTH_KEY);
  }

  static isAuthenticated(): boolean {
    return sessionStorage.getItem(this.AUTH_KEY) === "authenticated";
  }
}

