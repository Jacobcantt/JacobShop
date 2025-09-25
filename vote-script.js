// Twój config Firebase – wklejony!
const firebaseConfig = {
  apiKey: "AIzaSyCs4_DmcFIn4mszvvooOjJu2d1RYZXcJkY",
  authDomain: "koszulka-challenge.firebaseapp.com",
  databaseURL: "https://koszulka-challenge-default-rtdb.firebaseio.com",
  projectId: "koszulka-challenge",
  storageBucket: "koszulka-challenge.firebasestorage.app",
  messagingSenderId: "291495913939",
  appId: "1:291495913939:web:ef288cc85dd7a10887e726"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Reszta bez zmian (urlParams, loadOwner() itd.)
const urlParams = new URLSearchParams(window.location.search);
const ownerId = urlParams.get('owner');

const db = firebase.database();

if (ownerId) {
    loadOwner(ownerId);
} else {
    document.getElementById('vote-section').innerHTML = '<h2>Nieprawidłowy link. Cofnij się do rankingu.</h2>';
}

function loadOwner(id) {
    db.ref(`owners/${id}`).once('value').then(snapshot => {
        const owner = snapshot.val();
        if (!owner) return;

        document.getElementById('owner-name').textContent = owner.name;
        document.getElementById('owner-tiktok').textContent = owner.tiktokHandle;
        document.getElementById('votes-count').textContent = `${owner.votes} głosów`;

        if (owner.photoUrl) {
            const img = document.getElementById('owner-photo');
            img.src = owner.photoUrl;
            img.style.display = 'block';
        }

        // Embed TikTok video (ostatnie via API - uprość, jeśli nie)
        fetch(`https://open.tiktokapis.com/v2/oembed?url=${owner.tiktokLink}?rand=${Math.random()}`)
            .then(res => res.json())
            .then(data => {
                if (data.data && data.data.html) {
                    document.getElementById('tiktok-video').innerHTML = data.data.html;
                }
            });

        const progressFill = document.getElementById('progress-fill');
        // Pobierz max votes dla %
        db.ref('owners').once('value').then(snap => {
            let maxVotes = 0;
            snap.forEach(child => { if (child.val().votes > maxVotes) maxVotes = child.val().votes; });
            progressFill.style.width = maxVotes ? `${(owner.votes / maxVotes) * 100}%` : '0%';
        });

        const voteBtn = document.getElementById('vote-btn');
        const votedKey = `voted_${id}_${localStorage.getItem('deviceId') || 'unknown'}`;
        if (localStorage.getItem(votedKey)) {
            voteBtn.disabled = true;
            voteBtn.textContent = 'Już zagłosowałeś!';
        } else {
            voteBtn.addEventListener('click', () => voteForOwner(id));
        }
    });
}

function voteForOwner(id) {
    const updates = {};
    updates[`owners/${id}/votes`] = firebase.database.ServerValue.increment(1);
    db.ref().update(updates);

    localStorage.setItem(`voted_${id}_${localStorage.getItem('deviceId') || generateDeviceId()}`, 'true');
    document.getElementById('vote-btn').disabled = true;
    document.getElementById('vote-btn').textContent = 'Dzięki za głos!';
    document.getElementById('share-section').style.display = 'block';
    location.reload(); // Refresh dla update
}

function generateDeviceId() {
    let id = localStorage.getItem('deviceId');
    if (!id) {
        id = Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', id);
    }
    return id;
}

function shareTikTok() {
    const text = `Właśnie zagłosowałem na ${document.getElementById('owner-name').textContent} w #KoszulkaChallenge! Sprawdź: ${window.location.href}`;
    window.open(`https://www.tiktok.com/share?text=${encodeURIComponent(text)}`, '_blank');
}

function shareTwitter() {
    const text = `Właśnie zagłosowałem na ${document.getElementById('owner-name').textContent} w #KoszulkaChallenge! ${window.location.href}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');

}
