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

function loadRanking() {
    const rankingList = document.getElementById('ranking-list');
    const searchInput = document.getElementById('search');

    db.ref('owners').once('value').then(snapshot => {
        let owners = [];
        snapshot.forEach(child => {
            const owner = child.val();
            owner.id = child.key;
            owners.push(owner);
        });
        owners.sort((a, b) => b.votes - a.votes);
        displayRanking(owners.slice(0, 10));

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = owners.filter(o => 
                o.name.toLowerCase().includes(query) || o.tiktokHandle.toLowerCase().includes(query)
            );
            displayRanking(filtered.slice(0, 10));
        });
    });
}

function displayRanking(owners) {
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = '';
    if (owners.length === 0) {
        rankingList.innerHTML = '<p style="text-align:center; color:#ccc;">Brak właścicieli – dodaj w adminie!</p>';
        return;
    }
    owners.forEach((owner, index) => {
        const maxVotes = Math.max(...owners.map(o => o.votes));
        const progressPercent = maxVotes > 0 ? (owner.votes / maxVotes) * 100 : 0;
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
            <div>
                <h3>${index + 1}. ${owner.name}</h3>
                <p>${owner.tiktokHandle} | ${owner.votes} głosów</p>
                <a href="vote.html?owner=${owner.id}" style="color: #ccc;">Zobacz profil</a>
            </div>
            <div class="progress-bar">
                <div style="width: ${progressPercent}%;"></div>
            </div>
        `;
        rankingList.appendChild(item);
    });
}

loadRanking();
