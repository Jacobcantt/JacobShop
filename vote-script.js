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

// Ulepszona funkcja: Async canvas z await na img i DB
async function shareScreenshot() {
    const name = document.getElementById('owner-name').textContent;
    const votesElement = document.getElementById('votes-count');
    const votes = parseInt(votesElement.textContent.replace(' głosów', '').trim()); // Liczba jako int
    const ownerId = new URLSearchParams(window.location.search).get('owner'); // Pobierz ID ownera z URL
    const photoUrl = document.getElementById('owner-photo').src || '';
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // Tło gradient + siatka (synchroniczne)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000');
    gradient.addColorStop(1, '#111');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Promise dla zdjęcia (z fallback na initials)
    const loadImagePromise = new Promise((resolve) => {
        if (photoUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                ctx.save(); // Zapisz stan
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 20;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 10;

                ctx.beginPath();
                ctx.arc(540, 400, 250, 0, 2 * Math.PI);
                ctx.clip();
                ctx.drawImage(img, 290, 150, 500, 500);
                ctx.restore(); // Przywróć stan

                ctx.save();
                ctx.beginPath();
                ctx.arc(540, 400, 250, 0, 2 * Math.PI);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 5;
                ctx.stroke();
                ctx.restore();

                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                resolve('photo_loaded');
            };
            img.onerror = () => {
                // Fallback initials nawet z photoUrl błędnym
                drawInitialsFallback();
                resolve('fallback_used');
            };
            img.src = photoUrl;
        } else {
            drawInitialsFallback();
            resolve('no_photo');
        }
    });

    // Funkcja fallback initials (użyta w obydwu przypadkach)
    function drawInitialsFallback() {
        ctx.save();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(540, 400, 250, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 120px Arial, sans-serif'; // Fallback font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // Wyrównanie pionowe
        const initials = name.charAt(0).toUpperCase();
        ctx.fillText(initials, 540, 400);
        ctx.restore();
    }

    // Promise dla ranku i procentu (z fallback z data-attr, plus obliczanie miejsca)
    const loadRankPromise = new Promise((resolve) => {
        // Spróbuj fallback z data-attr (teraz pełne: place i percent)
        const fallbackPlace = votesElement.getAttribute('data-place') || '-';
        const fallbackPercent = parseInt(votesElement.getAttribute('data-percent') || 0);
        if (fallbackPlace !== null && fallbackPercent >= 0) {
            resolve({ place: fallbackPlace, percent: fallbackPercent });
            return;
        }
        // Jeśli brak fallback, pobierz z DB i oblicz pełne dane
        db.ref('owners').once('value').then(snap => {
            let owners = [];
            let totalVotes = 0;
            snap.forEach(child => {
                const owner = child.val();
                owners.push({ id: child.key, votes: owner.votes || 0 });
                totalVotes += owner.votes || 0;
            });
            // Sortuj po votes descending
            owners.sort((a, b) => b.votes - a.votes);
            // Znajdź miejsce current ownera
            const place = owners.findIndex(o => o.id === ownerId) + 1;
            const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            resolve({ place: place >= 0 ? place.toString() : '-', percent });
        }).catch(err => {
            resolve({ place: '-', percent: 0 }); // Fallback
        });
    });

    // Await oba Promise
    await Promise.all([loadImagePromise, loadRankPromise]);
    const rankData = await loadRankPromise;

    // Teraz finalizeCanvas (synchroniczne, po wszystkich awaits)
    finalizeCanvas();

    function finalizeCanvas() {
        // Ustaw globalne wyrównanie dla tekstu
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Nick właściciela (biały, bold, centrowany, z lekkim cieniem)
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 70px Arial, sans-serif'; // Mniejszy dla proporcji
        ctx.fillText(name, 540, 800); // Większy odstęp od zdjęcia
        ctx.restore();

        // Głosy: (szary, bold)
        ctx.fillStyle = '#ccc';
        ctx.font = 'bold 45px Arial, sans-serif'; // Mniejszy
        ctx.fillText('Głosy:', 540, 900);

        // Liczba głosów (złoty, bold) + ikona
        ctx.fillStyle = '#FFD700'; // Złoty
        ctx.font = 'bold 65px Arial, sans-serif';
        ctx.fillText(votes.toString(), 540, 1000);
        ctx.font = 'bold 50px Arial, sans-serif'; // Mniejsza ikona
        ctx.fillText('⭐', 650, 1000); // Bliżej liczby

        // Miejsce + procent (subtelny, szary, italic)
        if (rankData.percent > 0 || rankData.place !== '-') {
            ctx.fillStyle = '#ccc';
            ctx.font = 'italic 35px Arial, sans-serif'; // Mniejszy, by nie nakładać
            const rankText = `Miejsce ${rankData.place} (${rankData.percent}%) w rankingu`;
            ctx.fillText(rankText, 540, 1100);
        }

        // Napis "Dzięki za oddany głos!" (złoty, italic, cień – niżej, mniejszy)
        ctx.save();
        ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'italic 50px Arial, sans-serif'; // Mniejszy, by nie ciąć
        ctx.fillText('Dzięki za oddany głos!', 540, 1400); // Większy odstęp
        ctx.restore();

        // Hashtag #JacobcanVote (biały, bold, niżej)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 35px Arial, sans-serif';
        ctx.fillText('#JacobcanVote', 540, 1800);

        // Logo (async, ale nie blokuj export – mniejsze, niżej)
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
            ctx.drawImage(logoImg, 510, 1850, 60, 60); // Mniejsze, centrowane niżej
            exportCanvas();
        };
        logoImg.onerror = () => {
            exportCanvas(); // Zawsze export
        };
        logoImg.src = 'https://p19-common-sign-useastred.tiktokcdn-eu.com/tos-useast2a-avt-0068-euttp/fb6037524521e68cc26cafa4494d4c58~tplv-tiktokx-cropcenter:720:720.jpeg?dr=10399&refresh_token=76767a25&x-expires=1759003200&x-signature=TG4TByTHEFTeMdlTl3WMgr6UinM%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=no1a';

        function exportCanvas() {
            canvas.toBlob((blob) => {
                const file = new File([blob], `${name}-vote-wear.png`, { type: 'image/png' });
                const shareData = {
                    files: [file],
                    title: 'JacobcanVote - Mój głos!',
                    text: `Właśnie zagłosowałem na ${name} w #JacobcanVote! ${votes} głosów`
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
            }, 'image/png', 1.0);
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

        // Pobierz sumę wszystkich votes, miejsce i % (z cache dla share)
        db.ref('owners').once('value').then(snap => {
            let owners = [];
            let totalVotes = 0;
            snap.forEach(child => {
                const o = child.val();
                owners.push({ id: child.key, votes: o.votes || 0 });
                totalVotes += o.votes || 0;
            });
            // Sortuj po votes descending
            owners.sort((a, b) => b.votes - a.votes);
            // Znajdź miejsce current ownera
            const place = owners.findIndex(o => o.id === id) + 1;
            const progressPercent = totalVotes > 0 ? Math.round((owner.votes / totalVotes) * 100) : 0;
            console.log('Progress % w profilu:', progressPercent, 'Miejsce:', place, 'Suma:', totalVotes);
            document.querySelector('.progress-fill').style.width = `${progressPercent}%`;
            // Zapisz pełne dane w data attr dla share (szybki fallback)
            const votesElement = document.getElementById('votes-count');
            votesElement.setAttribute('data-place', place >= 0 ? place.toString() : '-');
            votesElement.setAttribute('data-percent', progressPercent);
        });

        const voteBtn = document.getElementById('vote-btn');
        const shareSection = document.getElementById('share-section');

        if (source === 'ranking') {
            voteBtn.style.display = 'none';
            document.getElementById('votes-count').innerHTML += ' <span style="color:#ccc;">(Tylko dla skanujących QR)</span>';
            shareSection.style.display = 'none';
            document.title = `Profil: ${owner.name} - JacobcanVote`;
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

            // Update progress i miejsce
            db.ref('owners').once('value').then(snap => {
                let owners = [];
                let totalVotes = 0;
                snap.forEach(child => {
                    const o = child.val();
                    owners.push({ id: child.key, votes: o.votes || 0 });
                    totalVotes += o.votes || 0;
                });
                // Sortuj po votes descending
                owners.sort((a, b) => b.votes - a.votes);
                // Znajdź nowe miejsce
                const place = owners.findIndex(o => o.id === id) + 1;
                const progressPercent = totalVotes > 0 ? Math.round((owner.votes / totalVotes) * 100) : 0;
                document.querySelector('.progress-fill').style.width = `${progressPercent}%`;
                // Update data attr dla share
                const votesElement = document.getElementById('votes-count');
                votesElement.setAttribute('data-place', place >= 0 ? place.toString() : '-');
                votesElement.setAttribute('data-percent', progressPercent);
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
    const text = `Właśnie zagłosowałem na ${document.getElementById('owner-name').textContent} w #JacobcanVote! Sprawdź: ${window.location.href}`;
    window.open(`https://www.tiktok.com/share?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

function shareTwitter() {
    const text = `Właśnie zagłosowałem na ${document.getElementById('owner-name').textContent} w #JacobcanVote! ${window.location.href}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

