import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  AuthService,
  User
} from '../services/auth.service';

import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  host: {
    '(mousemove)': 'resetUserTimeout()',
    '(keydown)': 'resetUserTimeout()',
    '(click)': 'resetUserTimeout()',
    '(wheel)': 'resetUserTimeout()'
  }
})

export class UserDashboardComponent
implements OnInit, OnDestroy {

  private refreshInterval: any;
  // ✅ USER TAB TIMEOUT
  private userTimeout: any = null;

  user: any = null;

  users: User[] = [];

  loading = true;

  errorMsg = '';

  broadcastMessages: any[] = [];

  unreadAdminMessage: any = null;

  activeTab: string = 'notice';

  admin: User = {

    name: 'ADMIN USER',

    firstName: 'ADMIN',

    lastName: 'USER',

    email: 'admin@gmail.com',

    role: 'Admin',

    status: 'approved'
  };

  constructor(
    private auth: AuthService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    // ✅ TAB LOCK SYSTEM
    const email =
      sessionStorage.getItem('email');

    if (email) {

      // CREATE TAB ID
      if (!sessionStorage.getItem('tabId')) {

        sessionStorage.setItem(
          'tabId',
          crypto.randomUUID()
        );

      }

      const tabId =
        sessionStorage.getItem('tabId');

      const storageKey =
        `activeTab_${email}`;

      const existingTab =
        localStorage.getItem(storageKey);

      // BLOCK SAME USER
      if (
        existingTab &&
        existingTab !== tabId
      ) {

        alert(
          'This user is already active in another tab'
        );

        sessionStorage.clear();

        this.router.navigate(['/']);

        return;
      }

      // REGISTER TAB
      localStorage.setItem(
        storageKey,
        tabId || ''
      );

      // REMOVE LOCK ON CLOSE
      window.addEventListener(
        'beforeunload',
        () => {

          const active =
            localStorage.getItem(storageKey);

          if (active === tabId) {

            localStorage.removeItem(storageKey);
          }
        }
      );
    }
    // ✅ USER EMAIL
    const currentEmail =
      sessionStorage.getItem('email');
    if (!currentEmail) {
      this.errorMsg =
        "Session expired. Please login again.";
      this.loading = false;
      this.cd.detectChanges();
      return;
    }
    // ✅ LOAD USER
    this.loadUser(currentEmail);
    // ✅ LOAD OTHER USERS
    this.loadAllUsers(currentEmail);
    // ✅ AUTO REFRESH
    this.refreshInterval = setInterval(() => {
      if (this.user) {
        this.loadMessages();
      }
    }, 3000);
  }
  setTab(tab: string) {
    this.activeTab = tab;
    // ✅ START TIMER ONLY FOR F TAB
    if (tab === 'users') {
      this.startUserTimeout();
    }
    else {
      this.clearUserTimeout();
    }
  }
  // =========================
  // START USER TIMEOUT
  // =========================
  startUserTimeout() {
    this.clearUserTimeout();
    this.userTimeout = setTimeout(() => {
      alert(
        '20 seconds inactivity timeout in F Tab'
      );
      this.logout();
    }, 20000);
  }
  // =========================
  // CLEAR USER TIMEOUT
  // =========================
  clearUserTimeout() {
    if (this.userTimeout) {
      clearTimeout(this.userTimeout);
      this.userTimeout = null;
    }
  }
  // =========================
  // RESET USER TIMEOUT
  // =========================
  resetUserTimeout() {

    if (this.activeTab === 'users') {

      this.startUserTimeout();

    }

  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.clearUserTimeout();
  }

  // =========================
  // LOAD CURRENT USER
  // =========================
  loadUser(email: string) {

    this.auth.getUserByEmail(email)
      .subscribe({

        next: (res: any) => {

          this.user = {

            name:
              (res.firstName || '') +
              ' ' +
              (res.lastName || ''),

            email:
              res.email || res.Email,

            role:
              res.role || res.Role,

            status:
              (
                res.status ||
                res.Status ||
                ''
              ).toUpperCase()

          };

          this.loadMessages();

          this.loading = false;

          this.cd.detectChanges();

        },

        error: (err) => {

          console.error(
            "User load error:",
            err
          );

          this.errorMsg =
            "Failed to load user";

          this.loading = false;

          this.cd.detectChanges();

        }

      });

  }

  // =========================
  // LOAD NOTICE + PERSONAL MSG
  // =========================
  loadMessages() {

    const email =
      this.user.email.toLowerCase();

    this.auth.getAllMessages()
      .subscribe({

        next: (res: any[]) => {

          // ✅ NOTICE BOARD
          this.broadcastMessages = res

            .filter(m =>

              m.senderEmail?.toLowerCase()
              === 'admin@gmail.com'

              &&

              m.receiverEmail?.toLowerCase()
              === 'all'
            )

            .map(m => ({

              ...m,

              formattedTime:
                new Date(
                  m.createdAt
                ).toLocaleString()

            }))

            .sort((a, b) =>

              new Date(b.createdAt)
                .getTime()

              -

              new Date(a.createdAt)
                .getTime()

            )

            .slice(0, 4);

          // ✅ PERSONAL ADMIN MESSAGE
          const personalMessages =
            res.filter(m =>

              m.senderEmail?.toLowerCase()
              === 'admin@gmail.com'

              &&

              m.receiverEmail?.toLowerCase()
              === email
            );

          this.unreadAdminMessage =

            personalMessages.length > 0

              ? personalMessages[
                  personalMessages.length - 1
                ]

              : null;

          this.cd.detectChanges();

        },

        error: (err) => {

          console.error(
            "Message load error",
            err
          );

        }

      });

  }

  // =========================
  // LOGOUT
  // =========================
  logout() {

    const email =
      sessionStorage.getItem('email');

    if (email) {

      localStorage.removeItem(
        `activeTab_${email}`
      );

    }

    this.auth.logout();

    this.router.navigate(['/']);

  }

  // =========================
  // LOAD OTHER USERS
  // =========================
  loadAllUsers(currentEmail: string) {

    this.auth.getUsers()
      .subscribe({

        next: (res: User[]) => {

          this.users = res

            .filter(u =>

              u.email.toLowerCase()

              !==

              currentEmail.toLowerCase()
            )

            .map(u => ({

              ...u,

              name:
                u.name ||
                (
                  u.firstName +
                  ' ' +
                  u.lastName
                )

            }));

          this.cd.detectChanges();

        },

        error: (err) => {

          console.error(
            "User list error:",
            err
          );

        }

      });

  }

  // =========================
  // MESSAGE USER
  // =========================
  messageUser(user: User) {

    sessionStorage.setItem(
      'chatUser',
      user.email
    );

    sessionStorage.setItem(
      'chatUserName',
      user.name || user.email
    );

    this.router.navigate(['/chat']);

  }

}
//