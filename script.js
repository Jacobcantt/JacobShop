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

// Inicjalizacja particles (białe kropki/cienie)
document.addEventListener('DOMContentLoaded', () => {
    particlesJS('particles-js', {
        particles: {
            number: { value: 50 },
            color: { value: '#ffffff' },
            shape: { type: 'circle' },
            opacity: { value: 0.3, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: false },
            move: { enable: true, speed: 1, direction: 'none', random: true }
        },
        interactivity: {
            events: { onhover: { enable: true, mode: 'repulse' } },
            modes: { repulse: { distance: 100, duration: 0.4 } }
        },
        retina_detect: true
    });
    // Animacja tytułu
    const title = document.getElementById('animated-title');
    const text = title.textContent;
    title.textContent = '';
    let i = 0;
    const typeWriter = () => {
        if (i < text.length) {
            title.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    };
    typeWriter();
});

function loadRanking() {
    const rankingList = document.getElementById('ranking-list');
    const searchInput = document.getElementById('search');

    db.ref('owners').once('value').then(snapshot => {
        let owners = [];
        let totalVotes = 0;
        let ownerCount = 0;
        snapshot.forEach(child => {
            const owner = child.val();
            owner.id = child.key;
            owners.push(owner);
            totalVotes += owner.votes || 0;
            ownerCount++;
        });
        console.log('Suma głosów w rankingu:', totalVotes);  // Debug

        // NOWE: Oblicz globalne miejsca dla wszystkich właścicieli
        const sortedOwners = [...owners].sort((a, b) => b.votes - a.votes);
        const globalPlaces = {};
        sortedOwners.forEach((owner, index) => {
            globalPlaces[owner.id] = index + 1;
        });

        // Przekaż globalPlaces do displayRanking
        displayRanking(owners.slice(0, 10), totalVotes, globalPlaces);

        // Aktualizuj statystyki
        document.getElementById('total-owners').textContent = ownerCount;
        document.getElementById('total-votes').textContent = totalVotes;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = owners.filter(o => 
                o.name.toLowerCase().includes(query) || o.tiktokHandle.toLowerCase().includes(query)
            );
            let filteredTotal = 0;
            filtered.forEach(o => filteredTotal += o.votes || 0);
            console.log('Suma głosów w search:', filteredTotal);  // Debug
            // Użyj tych samych globalPlaces dla filtrowanych
            displayRanking(filtered.slice(0, 10), filteredTotal, globalPlaces);
        });
    });
}

function displayRanking(owners, totalVotes, globalPlaces) {  // NOWE: parametr globalPlaces
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = '';
    if (owners.length === 0) {
        rankingList.innerHTML = '<p style="text-align:center; color:#ccc;">Brak właścicieli – dodaj w adminie!</p>';
        return;
    }
    owners.forEach((owner) => {  // NOWE: usuń index z forEach
        const globalPlace = globalPlaces[owner.id];  // Globalne miejsce
        const isTop1 = globalPlace === 1;
        const isTop2 = globalPlace === 2;
        const isTop3 = globalPlace === 3;
        const progressPercent = totalVotes > 0 ? Math.round((owner.votes / totalVotes) * 100) : (owners.length > 0 ? 100 : 0);
        const item = document.createElement('div');
        item.className = `ranking-item ${isTop1 ? 'top-1' : ''} ${isTop2 ? 'top-2' : ''} ${isTop3 ? 'top-3' : ''}`;
        const photoHtml = owner.photoUrl ? `<img src="${owner.photoUrl}" alt="Profil ${owner.name}" class="ranking-photo">` : '<div class="no-photo">?</div>';
        const voteIcon = owner.votes > 0 ? `<i class="fas fa-vote-yea" style="color:#FFD700; margin-left:0.5rem;"></i>` : '';
        const crown = isTop1 ? '<i class="fas fa-crown" style="color:#FFD700; margin-left:0.5rem;"></i>' : '';
        item.innerHTML = `
            <div style="display:flex; align-items:center;">
                ${photoHtml}
                <div>
                    <h3>${globalPlace}${crown}. ${owner.name}</h3>  <!-- NOWE: Użyj globalPlace -->
                    <p>${owner.tiktokHandle} | ${owner.votes} głosów ${voteIcon}</p>
                    <a href="vote.html?owner=${owner.id}&source=ranking" style="color: #ccc;">Zobacz profil</a>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}% !important;"></div>
            </div>
        `;
        rankingList.appendChild(item);
    });
}

loadRanking();
