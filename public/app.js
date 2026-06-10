async function checkAuth() {
    const res = await fetch('/api/me');
    const data = await res.json();
    const nav = document.getElementById('user-nav');
    if (data.loggedIn) {
        nav.innerHTML = `
            <span>${data.username}님 환영합니다</span>
            <a href="#" id="logout-btn">로그아웃</a>
        `;
        document.getElementById('logout-btn').onclick = logout;
        showPostList();
    } else {
        nav.innerHTML = `
            <a href="#" id="login-link">로그인</a>
            <a href="#" id="register-link">회원가입</a>
        `;
        document.getElementById('login-link').onclick = showLoginForm;
        document.getElementById('register-link').onclick = showRegisterForm;
        showLoginForm();
    }
}

function showLoginForm(e) {
    if (e) e.preventDefault();
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="auth-form">
            <h2>로그인</h2>
            <input type="text" id="username" placeholder="아이디">
            <input type="password" id="password" placeholder="비밀번호">
            <div class="checkbox-group">
                <input type="checkbox" id="autoLogin">
                <label for="autoLogin">자동 로그인</label>
            </div>
            <button id="login-btn">로그인</button>
            <div class="auth-links">
                계정이 없으신가요? <a href="#" id="to-register">회원가입</a>
            </div>
        </div>
    `;
    document.getElementById('login-btn').onclick = login;
    document.getElementById('to-register').onclick = showRegisterForm;
}

function showRegisterForm(e) {
    if (e) e.preventDefault();
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="auth-form">
            <h2>회원가입</h2>
            <input type="text" id="username" placeholder="아이디">
            <input type="password" id="password" placeholder="비밀번호">
            <button id="register-btn">가입하기</button>
            <div class="auth-links">
                이미 계정이 있으신가요? <a href="#" id="to-login">로그인</a>
            </div>
        </div>
    `;
    document.getElementById('register-btn').onclick = register;
    document.getElementById('to-login').onclick = showLoginForm;
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const autoLogin = document.getElementById('autoLogin').checked;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, autoLogin })
    });
    const data = await res.json();
    if (data.success) {
        checkAuth();
    } else {
        alert(data.error);
    }
}

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
        alert('회원가입 성공! 로그인해 주세요.');
        showLoginForm();
    } else {
        alert(data.error);
    }
}

async function logout(e) {
    e.preventDefault();
    await fetch('/api/logout', { method: 'POST' });
    checkAuth();
}

function showPostList() {
    const content = document.getElementById('content');
    content.innerHTML = `<h2>게시글 목록</h2><p>게시판 기능은 다음 단계에서 구현됩니다.</p>`;
}

checkAuth();