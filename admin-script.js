const ADMIN_PASSWORD = 'admin123'; // ZMIEŃ TO!

const db = firebase.database();
const storage = firebase.storage();

function loginAdmin() {
    const password = document.getElementById('admin-password').value;
    if (password === ADMIN_PASSWORD) {
        document.getElementById('login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        loadOwners();
    } else {
        alert('Błędne hasło!');
    }
}

document.getElementById('add-owner-form').addEventListener('submit', addOwner);

function addOwner(e) {
    e.preventDefault();
    const name = document.getElementById('owner-name').value;
    const handle = document.getElementById('tiktok-handle').value;
    const link = document.getElementById('tiktok-link').value;
    const file = document.getElementById('photo-upload').files[0];

    const newOwnerRef = db.ref('owners').push();
    const ownerId = newOwnerRef.key;
    const voteLink = `https://twoja-domena.com/vote.html?owner=${ownerId}`;

    const updates = {
        name: name,
        tiktokHandle: handle,
        tiktokLink: link,
        votes: 0,
        createdAt: Date.now()
    };

    if (file) {
        const storageRef = storage.ref(`photos/${ownerId}.jpg`);
        storageRef.put(file).then(snapshot => {
            snapshot.ref.getDownloadURL().then(url => {
                updates.photoUrl = url;
                newOwnerRef.set(updates);
                generateQR(voteLink);
                loadOwners();
            });
        });
    } else {
        newOwnerRef.set(updates);
        generateQR(voteLink);
        loadOwners();
    }

    document.getElementById('vote-link').value = voteLink;
    document.getElementById('qr-section').style.display = 'block';
}

function generateQR(url) {
    QRCode.toCanvas(document.getElementById('qr-canvas'), url, { width: 200, colorDark: '#000000', colorLight: '#ffffff' });
}

function downloadQR() {
    const canvas = document.getElementById('qr-canvas');
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = canvas.toDataURL();
    link.click();
}

function copyLink() {
    const link = document.getElementById('vote-link');
    link.select();
    document.execCommand('copy');
    alert('Skopiowano!');
}

function loadOwners() {
    const list = document.getElementById('owners-list');
    db.ref('owners').once('value').then(snapshot => {
        list.innerHTML = '';
        snapshot.forEach(child => {
            const owner = child.val();
            const div = document.createElement('div');
            div.className = 'ranking-item';
            div.innerHTML = `
                <span>${owner.name} (@${owner.tiktokHandle}) - ${owner.votes} głosów</span>
                <a href="/vote.html?owner=${child.key}">Link głosowania</a>
            `;
            list.appendChild(div);
        });
    });
}