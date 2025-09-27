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
    const votes = votesElement.textContent.replace(' głosów', '').trim(); // Czysta liczba, trim na safety
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

    console.log('Canvas init: Tło i siatka gotowe. Name:', name, 'Votes:', votes, 'Photo:', photoUrl); // Debug

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
                console.log('Zdjęcie załadowane i narysowane'); // Debug
                resolve('photo_loaded');
            };
            img.onerror = () => {
                console.warn('Błąd ładowania zdjęcia:', photoUrl); // Debug
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
        const initials = name.charAt(0).toUpperCase();
        ctx.fillText(initials, 540, 450);
        ctx.restore();
        console.log('Fallback initials narysowane'); // Debug
    }

    // Promise dla progressPercent (z fallback z data-attr)
    const loadProgressPromise = new Promise((resolve) => {
        const fallbackPercent = parseInt(votesElement.getAttribute('data-percent') || 0);
        if (fallbackPercent >= 0) {
            console.log('Używam fallback percent z data-attr:', fallbackPercent); // Debug
            resolve(fallbackPercent);
            return;
        }
        // Jeśli brak fallback, pobierz z DB
        db.ref('owners').once('value').then(snap => {
            let totalVotes = 0;
            snap.forEach(child => { totalVotes += child.val().votes || 0; });
            const percent = totalVotes > 0 ? Math.round((parseInt(votes) / totalVotes) * 100) : 0;
            console.log('Pobrano percent z DB:', percent, 'Total votes:', totalVotes); // Debug
            resolve(percent);
        }).catch(err => {
            console.error('Błąd DB dla percent:', err); // Debug
            resolve(0); // Fallback 0
        });
    });

    // Await oba Promise
    await Promise.all([loadImagePromise, loadProgressPromise]);
    const progressPercent = await loadProgressPromise; // Ponieważ all, ale weź wartość

    console.log('Wszystko async gotowe. Rysuję tekst z percent:', progressPercent); // Debug

    // Teraz finalizeCanvas (synchroniczne, po wszystkich awaits)
    finalizeCanvas();

    function finalizeCanvas() {
        ctx.save(); // Zapisz dla cieni
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 80px Arial, sans-serif'; // Fallback font
        ctx.textAlign = 'center';
        ctx.fillText(name, 540, 750);
        ctx.restore(); // Reset cień

        ctx.fillStyle = '#ccc';
        ctx.font = 'bold 50px Arial, sans-serif';
        ctx.fillText('Głosy:', 540, 850);

        ctx.fillStyle = '#FFD700'; // Złoty
        ctx.font = 'bold 70px Arial, sans-serif';
        ctx.fillText(votes, 540, 930);
        ctx.fillText('⭐', 700, 930); // Ikona obok

        if (progressPercent > 0) {
            ctx.fillStyle = '#ccc';
            ctx.font = 'italic 40px Arial, sans-serif';
            ctx.fillText(`${progressPercent}% w rankingu`, 540, 1000);
        }

        // Napis (złoty, italic, cień)
        ctx.save();
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'italic 60px Arial, sans-serif';
        ctx.fillText('Dzięki za oddany głos!', 540, 1200);
        ctx.restore();

        // Hashtag
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px Arial, sans-serif';
        ctx.fillText('#VoteWear', 540, 1700);

        // Logo (async, ale nie blokuj export)
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
            ctx.drawImage(logoImg, 500, 1750, 80, 80);
            console.log('Logo załadowane'); // Debug
            exportCanvas();
        };
        logoImg.onerror = () => {
            console.warn('Błąd ładowania logo – export bez'); // Debug
            exportCanvas(); // Zawsze export
        };
        logoImg.src = 'https://p19-common-sign-useastred.tiktokcdn-eu.com/tos-useast2a-avt-0068-euttp/fb6037524521e68cc26cafa4494d4c58~tplv-tiktokx-cropcenter:720:720.jpeg?dr=10399&refresh_token=76767a25&x-expires=1759003200&x-signature=TG4TByTHEFTeMdlTl3WMgr6UinM%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=no1a';

        function exportCanvas() {
            console.log('Export canvas – gotowy do share/download'); // Debug
            canvas.toBlob((blob) => {
                const file = new File([blob], `${name}-vote-wear.png`, { type: 'image/png' });
                const shareData = {
                    files: [file],
                    title: 'VoteWear - Mój głos!',
                    text: `Właśnie zagłosowałem na ${name} w #VoteWear! ${votes} głosów`
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

        // Pobierz sumę wszystkich votes dla % (z cache dla share)
        db.ref('owners').once('value').then(snap => {
            let totalVotes = 0;
            snap.forEach(child => { totalVotes += child.val().votes || 0; });
            const progressPercent = totalVotes > 0 ? Math.round((owner.votes / totalVotes) * 100) : 0;
            console.log('Progress % w profilu:', progressPercent, 'Suma:', totalVotes);
            document.querySelector('.progress-fill').style.width = `${progressPercent}%`;
            // Zapisz procent w data attr dla share (szybki fallback)
            votesElement.setAttribute('data-percent', progressPercent);
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
                // Update data attr dla share
                document.getElementById('votes-count').setAttribute('data-percent', progressPercent);
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
