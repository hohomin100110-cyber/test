let currentUser = null;

async function checkAuth() {
    const res = await fetch('/api/me');
    const data = await res.json();
    const nav = document.getElementById('user-nav');
    if (data.loggedIn) {
        currentUser = data;
        nav.innerHTML = `
            <span>${data.username}님 환영합니다</span>
            <a href="#" id="logout-btn">로그아웃</a>
        `;
        document.getElementById('logout-btn').onclick = logout;
        showPostList();
    } else {
        currentUser = null;
        nav.innerHTML = `
            <a href="#" id="login-link">로그인</a>
            <a href="#" id="register-link">회원가입</a>
        `;
        document.getElementById('login-link').onclick = showLoginForm;
        document.getElementById('register-link').onclick = showRegisterForm;
        showPostList(); // Show list even if not logged in
    }
}

async function showPostList() {
    const content = document.getElementById('content');
    const res = await fetch('/api/posts');
    const posts = await res.json();
    
    let html = `
        <div class="board-header">
            <h2>게시글 목록</h2>
            ${currentUser ? '<button id="write-btn">글쓰기</button>' : ''}
        </div>
        <table class="post-table">
            <thead>
                <tr>
                    <th>제목</th>
                    <th>작성자</th>
                    <th>작성일</th>
                </tr>
            </thead>
            <tbody>
                ${posts.map(post => `
                    <tr onclick="showPostDetail(${post.id})">
                        <td>${post.title}</td>
                        <td>${post.username}</td>
                        <td>${new Date(post.created_at).toLocaleDateString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    content.innerHTML = html;
    if (currentUser) {
        document.getElementById('write-btn').onclick = showWriteForm;
    }
}

function showWriteForm() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="post-form">
            <h2>글쓰기</h2>
            <input type="text" id="post-title" placeholder="제목을 입력하세요">
            <textarea id="post-content" placeholder="내용을 입력하세요" rows="10"></textarea>
            <div class="form-actions">
                <button onclick="showPostList()">취소</button>
                <button id="save-post-btn">저장</button>
            </div>
        </div>
    `;
    document.getElementById('save-post-btn').onclick = savePost;
}

async function savePost() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    
    const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
    });
    if (res.ok) {
        showPostList();
    } else {
        const data = await res.json();
        alert(data.error);
    }
}

async function showPostDetail(id) {
    const res = await fetch(`/api/posts/${id}`);
    const post = await res.json();
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="post-detail">
            <h2>${post.title}</h2>
            <div class="post-info">
                작성자: ${post.username} | 작성일: ${new Date(post.created_at).toLocaleString()}
            </div>
            <div class="post-body">${post.content.replace(/\n/g, '<br>')}</div>
            <div class="post-actions">
                <button onclick="showPostList()">목록으로</button>
                ${currentUser && currentUser.userId === post.user_id ? `
                    <button onclick="showEditForm(${post.id})">수정</button>
                    <button onclick="deletePost(${post.id})">삭제</button>
                ` : ''}
            </div>
        </div>
    `;
}

async function showEditForm(id) {
    const res = await fetch(`/api/posts/${id}`);
    const post = await res.json();
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="post-form">
            <h2>글 수정</h2>
            <input type="text" id="post-title" value="${post.title}">
            <textarea id="post-content" rows="10">${post.content}</textarea>
            <div class="form-actions">
                <button onclick="showPostDetail(${id})">취소</button>
                <button id="update-post-btn">수정완료</button>
            </div>
        </div>
    `;
    document.getElementById('update-post-btn').onclick = () => updatePost(id);
}

async function updatePost(id) {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    
    const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
    });
    if (res.ok) {
        showPostDetail(id);
    } else {
        const data = await res.json();
        alert(data.error);
    }
}

async function deletePost(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
        showPostList();
    } else {
        const data = await res.json();
        alert(data.error);
    }
}