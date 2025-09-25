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

function loadRanking() {
    const rankingList = document.getElementById('ranking-list');
    const searchInput = document.getElementById('search');

    db.ref('owners').once('value').then(snapshot => {
        let owners = [];
        let totalVotes = 0;
        snapshot.forEach(child => {
            const owner = child.val();
            owner.id = child.key;
            owners.push(owner);
            totalVotes += owner.votes || 0;  // Suma wszystkich głosów
        });
        console.log('Suma głosów w rankingu:', totalVotes);  // Debug – sprawdź w F12
        owners.sort((a, b) => b.votes - a.votes);
        displayRanking(owners.slice(0, 10), totalVotes);

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = owners.filter(o => 
                o.name.toLowerCase().includes(query) || o.tiktokHandle.toLowerCase().includes(query)
            );
            // Dla search: przelicz sumę tylko dla filtered
            let filteredTotal = 0;
            filtered.forEach(o => filteredTotal += o.votes || 0);
            console.log('Suma głosów w search:', filteredTotal);  // Debug
            displayRanking(filtered.slice(0, 10), filteredTotal);
        });
    });
}

function displayRanking(owners, totalVotes) {
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = '';
    if (owners.length === 0) {
        rankingList.innerHTML = '<p style="text-align:center; color:#ccc;">Brak właścicieli – dodaj w adminie!</p>';
        return;
    }
    owners.forEach((owner, index) => {
        const progressPercent = totalVotes > 0 ? Math.round((owner.votes / totalVotes) * 100) : (owners.length > 0 ? 100 : 0);  // Fallback 100% jeśli total=0
        const item = document.createElement('div');
        item.className = 'ranking-item';
        const photoHtml = owner.photoUrl ? `<img src="${owner.photoUrl}" alt="Profil ${owner.name}" class="ranking-photo">` : '<div class="no-photo">?</div>';  // Fallback placeholder
        item.innerHTML = `
            <div style="display:flex; align-items:center;">
                ${photoHtml}
                <div>
                    <h3>${index + 1}. ${owner.name}</h3>
                    <p>${owner.tiktokHandle} | ${owner.votes} głosów</p>
                    <a href="vote.html?owner=${owner.id}&source=ranking" style="color: #ccc;">Zobacz profil</a>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}% !important;"></div>  <!-- Dodany class i !important dla pewności -->
            </div>
        `;
        rankingList.appendChild(item);
    });
}

loadRanking();
