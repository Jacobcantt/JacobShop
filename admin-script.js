// Twój config Firebase – wklejony!
const firebaseConfig = {
  apiKey: "AIzaSyCs4_DmcFIn4mszvvooOjJu2d1RYZXcJkY",
  authDomain: "koszulka-challenge.firebaseapp.com",
  databaseURL: "https://koszulka-challenge-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "koszulka-challenge",
  storageBucket: "koszulka-challenge.firebasestorage.app",
  messagingSenderId: "291495913939",
  appId: "1:291495913939:web:ef288cc85dd7a10887e726"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();  // NOWE: Import Storage

const ADMIN_PASSWORD = 'admin123';

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

// Prevent default submit for login form (fix form warning)
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginAdmin();
        });
    }
});

document.getElementById('add-owner-form').addEventListener('submit', addOwner);

async function addOwner(e) {  // NOWE: async dla await uploadu
    e.preventDefault();
    const name = document.getElementById('owner-name').value;
    const handle = document.getElementById('tiktok-handle').value;
    const link = document.getElementById('tiktok-link').value;
    const bio = document.getElementById('owner-bio').value.trim();
    const photoFile = document.getElementById('photo-file').files[0];  // NOWE: Pobierz plik

    const newOwnerRef = db.ref('owners').push();
    const ownerId = newOwnerRef.key;
    const voteLink = `https://jacobcantt.github.io/JacobShop/vote.html?owner=${ownerId}`;

    const updates = {
        name: name,
        tiktokHandle: handle,
        tiktokLink: link,
        votes: 0,
        createdAt: Date.now()
    };

    if (bio) {
        updates.bio = bio;
    }

    // NOWE: Upload zdjęcia do Storage, jeśli plik istnieje
    let photoUrl = null;
    if (photoFile) {
        try {
            const storageRef = storage.ref().child(`owners/${ownerId}/profile.jpg`);  // Ścieżka: owners/{id}/profile.jpg
            const snapshot = await storageRef.put(photoFile);  // Upload
            photoUrl = await snapshot.ref.getDownloadURL();  // Pobierz trwały URL
            updates.photoUrl = photoUrl;  // Zapisz w DB
            console.log('Zdjęcie uploaded: ', photoUrl);
        } catch (error) {
            console.error('Błąd uploadu zdjęcia:', error);
            alert('Błąd uploadu zdjęcia – spróbuj ponownie lub pomiń.');
        }
    }

    // Zapisz do DB (z photoUrl jeśli uploaded)
    newOwnerRef.set(updates).then(() => {
        console.log('Właściciel dodany pomyślnie!');
        loadOwners();
    }).catch(err => {
        console.error('Błąd zapisu do Firebase:', err);
        alert('Błąd dodawania właściciela – sprawdź połączenie z Firebase.');
    });

    document.getElementById('vote-link').value = voteLink;
    document.getElementById('qr-section').style.display = 'block';
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
                <a href="vote.html?owner=${child.key}">Link głosowania</a>
            `;
            list.appendChild(div);
        });
    }).catch(err => {
        console.error('Błąd ładowania właścicieli:', err);
    });
}
