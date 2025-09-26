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

// Confetti lib (proste, na głosowanie)
function confettiExplosion() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.onload = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffffff', '#FFD700']  // Biały i złoty
        });
    };
    document.head.appendChild(script);
}

// Ulepszona funkcja: Custom grafika z canvas (ciemne tło, elegancki design)
function shareScreenshot() {
    const name = document.getElementById('owner-name').textContent;
    const votes = document.getElementById('votes-count').textContent;
    const photoUrl = document.getElementById('owner-photo').src || '';  // URL zdjęcia

    // Canvas: 400x600px, ciemne tło
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Ciemne tło z gradientem (czarne do ciemnoszare)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000');
    gradient.addColorStop(1, '#111');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtelna siatka/tekstura (cienie – opcjonalnie, dla elegancji)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Zdjęcie profilowe (okrągłe, z cieniem i ramką)
    if (photoUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            // Cień pod zdjęciem
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 5;

            // Okrągłe crop
            ctx.beginPath();
            ctx.arc(200, 150, 110, 0, 2 * Math.PI);  // Większe koło
            ctx.clip();
            ctx.drawImage(img, 90, 40, 220, 220);  // Crop do koła
            ctx.restore();

            // Rama wokół zdjęcia (biała z cieniem)
            ctx.beginPath();
            ctx.arc(200, 150, 110, 0, 2 * Math.PI);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Reset cienia
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            finalizeCanvas();
        };
        img.src = photoUrl;
    } else {
        // Fallback placeholder (ciemny krąg z "?"
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(200, 150, 110, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('?', 200, 170);
        finalizeCanvas();
    }

    function finalizeCanvas() {
        // Nazwa właściciela (biały, bold, centrowany)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Inter';  // Większy font
        ctx.textAlign = 'center';
        ctx.fillText(name, 200, 320);

        // Liczba głosów (szary tekst, z ikoną)
        ctx.fillStyle = '#ccc';
        ctx.font = '24px Inter';
        ctx.fillText('Głosy:', 200, 370);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Inter';
        ctx.fillText(votes, 200, 410);

        // Napis "Dzięki za głos!" (złoty, italic, z cieniem)
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'italic 28px Inter';
        ctx.fillText('Dzięki za głos!', 200, 470);

        // Logo VoteWear na dole (małe, centrowane)
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
            ctx.drawImage(logoImg, 160, 500, 80, 80);  // Małe logo
            ctx.shadowColor = 'transparent';  // Reset cienia
            exportCanvas();
        };
        logoImg.src = 'https://p19-common-sign-useastred.tiktokcdn-eu.com/tos-useast2a-avt-0068-euttp/fb6037524521e68cc26cafa4494d4c58~tplv-tiktokx-cropcenter:720:720.jpeg?dr=10399&refresh_token=76767a25&x-expires=1759003200&x-signature=TG4TByTHEFTeMdlTl3WMgr6UinM%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=no1a';

        function exportCanvas() {
            canvas.toBlob((blob) => {
                const file = new File([blob], `${name}-vote-wear.png`, { type: 'image/png' });
                const shareData = {
                    files: [file],
                    title: 'VoteWear - Mój głos!',
                    text: `Właśnie zagłosowałem na ${name} w #VoteWear! ${votes}`
                };

                if (navigator.canShare && navigator.canShare({ files: shareData.files })) {
                    navigator.share(shareData).catch(err => console.log('Błąd share:', err));
                } else {
                    // Fallback: Download
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            }, 'image/png', 1.0);  // 100% jakość
        }
    }
}

// Check for deprecated storage (suppress warning)
if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});  // Silent fail
}

const urlParams = new URLSearchParams(window.location.search);
const ownerId = urlParams.get('owner');
const source = urlParams.get('source');  // 'ranking' ukrywa głosowanie

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

        // Stylowy przycisk TikTok z ikoną
        document.getElementById('tiktok-video').innerHTML = `<a href="${owner.tiktokLink}" target="_blank" class="tiktok-btn"><i class="fab fa-tiktok"></i> Obejrzyj na TikTok</a>`;
        document.getElementById('tiktok-video').style.display = 'block';

        // Bio właściciela
        const bioSection = document.getElementById('owner-bio');
        if (owner.bio && owner.bio.trim()) {
            bioSection.innerHTML = `<i class="fas fa-quote-left" style="color:#ccc; margin-right:0.5rem;"></i><span>${owner.bio}</span>`;
            bioSection.style.display = 'block';
        }

        // Pobierz sumę wszystkich votes dla %
        db.ref('owners').once('value').then(snap => {
            let totalVotes = 0;
            snap.forEach(child => { totalVotes += child.val().votes || 0; });
            const progressPercent = totalVotes > 0 ? Math.round((owner.votes / totalVotes) * 100) : 0;
            console.log('Progress % w profilu:', progressPercent, 'Suma:', totalVotes);
            document.querySelector('.progress-fill').style.width = `${progressPercent}%`;
        });

        const voteBtn = document.getElementById('vote-btn');
        const shareSection = document.getElementById('share-section');

        if (source === 'ranking') {
            voteBtn.style.display = 'none';
            document.getElementById('votes-count').innerHTML += ' <span style="color:#ccc;">(Tylko dla skanujących QR)</span>';
            shareSection.style.display = 'none';
            document.title = `Profil: ${owner.name} - VoteWear`;
        } else {
            const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
            const votedKey = `voted_${id}_${deviceId}`;
            if (localStorage.getItem(votedKey)) {
                voteBtn.disabled = true;
                voteBtn.textContent = 'Już zagłosowałeś!';
            } else {
                voteBtn.addEventListener('click', () => voteForOwner(id));
            }
        }
    });
}

function voteForOwner(id) {
    const updates = {};
    updates[`owners/${id}/votes`] = firebase.database.ServerValue.increment(1);
    db.ref().update(updates);

    const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
    localStorage.setItem(`voted_${id}_${deviceId}`, 'true');
    document.getElementById('vote-btn').disabled = true;
    document.getElementById('vote-btn').textContent = 'Dzięki za głos!';
    document.getElementById('share-section').style.display = 'block';
    confettiExplosion();  // Confetti trwa ~2s

    // Dynamiczny update po 2s (bez reload)
    setTimeout(() => {
        // Pobierz nowe dane właściciela
        db.ref(`owners/${id}`).once('value').then(snapshot => {
            const owner = snapshot.val();
            document.getElementById('votes-count').textContent = `${owner.votes} głosów`;

            // Update progress
            db.ref('owners').once('value').then(snap => {
                let totalVotes = 0;
                snap.forEach(child => { totalVotes += child.val().votes || 0; });
                const progressPercent = totalVotes > 0 ? Math.round((owner.votes / totalVotes) * 100) : 0;
                document.querySelector('.progress-fill').style.width = `${progressPercent}%`;
            });
        });
    }, 2000);  // 2 sekundy po confetti
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
    const text = `Właśnie zagłosowałem na ${document.getElementById('owner-name').textContent} w #VoteWear! Sprawdź: ${window.location.href}`;
    window.open(`https://www.tiktok.com/share?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

function shareTwitter() {
    const text = `Właśnie zagłosowałem na ${document.getElementById('owner-name').textContent} w #VoteWear! ${window.location.href}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}
