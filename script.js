// Firebase Config - Wklej swój config tutaj!
const firebaseConfig = {
    // apiKey: "YOUR_API_KEY",
    // authDomain: "YOUR_PROJECT.firebaseapp.com",
    // databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    // projectId: "YOUR_PROJECT",
    // storageBucket: "YOUR_PROJECT.appspot.com",
    // messagingSenderId: "123",
    // appId: "YOUR_APP_ID"
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
    owners.forEach((owner, index) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
            <div>
                <h3>${index + 1}. ${owner.name}</h3>
                <p>${owner.tiktokHandle} | ${owner.votes} głosów</p>
                <a href="/vote.html?owner=${owner.id}" style="color: #ccc;">Zobacz profil</a>
            </div>
            <div class="progress-bar">
                <div style="width: ${Math.min((owner.votes / Math.max(...owners.map(o => o.votes))) * 100, 100)}%;"></div>
            </div>
        `;
        rankingList.appendChild(item);
    });
}

loadRanking();