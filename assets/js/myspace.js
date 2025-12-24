async function loadMyProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
            throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        updateUI(data);

    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function updateUI(user) {
    // Basic Info
    document.getElementById('usernameVal').textContent = user.username;
    document.getElementById('uidVal').textContent = user.uid;
    document.getElementById('levelBadge').textContent = `Lvl ${user.level}`;
    document.getElementById('cashVal').textContent = `$ ${user.cash.toLocaleString()}`;
    document.getElementById('bankVal').textContent = `$ ${user.bank.toLocaleString()}`;
    document.getElementById('hoursVal').textContent = `${user.hours} Hours`;
    document.getElementById('warningCount').textContent = `${user.warnings} / 3`;

    // Skin Image
    const skinImg = document.getElementById('skinImg');
    const SKIN_BASE = "https://assets.open.mp/assets/images/skins/";
    skinImg.src = `${SKIN_BASE}${user.skin}.png`;
    skinImg.onerror = () => {
        skinImg.src = `${SKIN_BASE}0.png`; // Fallback to CJ
    };

    // Whitelist Status
    const wb = document.getElementById('whitelistBadge');
    wb.textContent = user.whitelistStatus;
    if (user.whitelistStatus.toLowerCase() === 'approved') {
        wb.style.borderColor = 'var(--accent)';
        wb.style.color = 'var(--accent)';
    } else if (user.whitelistStatus.toLowerCase() === 'pending') {
        wb.style.borderColor = '#fbbf24';
        wb.style.color = '#fbbf24';
    }

    // Warning highlight
    if (user.warnings > 0) {
        document.getElementById('warningSection').style.display = 'block';
        if (user.warnings >= 3) {
            document.getElementById('warningItem').style.borderColor = '#ff3232';
            document.getElementById('warningItem').style.color = '#ff3232';
        }
    } else {
        document.getElementById('warningItem').classList.remove('warning-item');
        document.getElementById('warningItem').classList.add('warning-item', 'none');
        document.getElementById('warningItem').innerHTML = `<span>Clear Record</span> <i class="fas fa-check-circle"></i>`;
    }

    // Inventory Grid
    const inventoryGrid = document.getElementById('inventoryGrid');
    inventoryGrid.innerHTML = '';

    const items = [
        { name: 'Materials', count: user.materials, icon: 'fa-cog' },
        { name: 'Pot', count: user.pot, icon: 'fa-leaf' },
        { name: 'Crack', count: user.crack, icon: 'fa-snowflake' },
        { name: 'Meth', count: user.meth, icon: 'fa-flask' },
        { name: 'Painkillers', count: user.painkillers, icon: 'fa-pills' },
        { name: 'Seeds', count: user.seeds, icon: 'fa-seedling' },
        { name: 'Walkie-Talkie', count: user.walkietalkie, icon: 'fa-walkie-talkie' },
        { name: 'Boombox', count: user.boombox, icon: 'fa-radio' },
        { name: 'MP3 Player', count: user.mp3player, icon: 'fa-music' },
        { name: 'Laptop', count: user.laptop, icon: 'fa-laptop' },
        { name: 'Flashlight', count: user.flashlight, icon: 'fa-lightbulb' },
        { name: 'Bandage', count: user.bandage, icon: 'fa-band-aid' },
        { name: 'Medkit', count: user.medkit, icon: 'fa-medkit' },
        { name: 'Plastic', count: user.plastic, icon: 'fa-bottle-water' },
        { name: 'Steel', count: user.steel, icon: 'fa-bore-hole' },
        { name: 'Glass', count: user.glass, icon: 'fa-cube' },
        { name: 'Copper', count: user.copper, icon: 'fa-cubes' }
    ];

    items.forEach(item => {
        if (item.count > 0) {
            const slot = document.createElement('div');
            slot.className = 'item-slot';
            slot.innerHTML = `
                <i class="fas ${item.icon}"></i>
                <span class="item-name">${item.name}</span>
                <span class="item-count">${item.count}</span>
            `;
            inventoryGrid.appendChild(slot);
        }
    });

    if (inventoryGrid.innerHTML === '') {
        inventoryGrid.innerHTML = `<div style="grid-column: span 12; text-align: center; color: var(--text-dim); padding: 40px;">No physical assets found in local storage.</div>`;
    }

    // Licenses
    const licenseGrid = document.getElementById('licenseGrid');
    licenseGrid.innerHTML = '';
    const licenses = [
        { name: 'Vehicle License', status: user.carlicense, icon: 'fa-car' },
        { name: 'Firearm License', status: user.gunlicense, icon: 'fa-gun' }
    ];

    licenses.forEach(lic => {
        const slot = document.createElement('div');
        slot.className = 'item-slot';
        if (lic.status === 1 || lic.status === true) {
            slot.style.borderColor = 'var(--primary)';
            slot.innerHTML = `
                <i class="fas ${lic.icon}" style="color: var(--primary);"></i>
                <span class="item-name">${lic.name}</span>
                <span class="item-count" style="background: var(--primary);">ACTIVE</span>
            `;
        } else {
            slot.style.opacity = '0.3';
            slot.innerHTML = `
                <i class="fas ${lic.icon}"></i>
                <span class="item-name">${lic.name}</span>
                <span class="item-count" style="background: #333;">LOCKED</span>
            `;
        }
        licenseGrid.appendChild(slot);
    });

    // XENO Balance
    if (document.getElementById('userXeno')) {
        document.getElementById('userXeno').innerHTML = `${user.XENO.toLocaleString()}`;
    }

    // Admin Access
    if (user.adminlevel > 0) {
        const actions = document.getElementById('profileActions');
        if (actions && !document.getElementById('adminLink')) {
            const adminLink = document.createElement('a');
            adminLink.id = 'adminLink';
            adminLink.href = 'admin.html';
            adminLink.classList.add('btn', 'btn-primary');
            adminLink.style.width = '100%';
            adminLink.style.justifyContent = 'center';
            adminLink.innerHTML = '<i class="fas fa-shield-alt"></i> Admin Dashboard';
            actions.prepend(adminLink);
        }
    }
}

async function redeemXeno() {
    const code = document.getElementById('redeemCode').value;
    const token = localStorage.getItem('token');

    if (!code) return alert('Enter a valid code');

    try {
        const response = await fetch('/api/xeno/redeem', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            location.reload();
        } else {
            alert(result.error || 'Redemption failed');
        }
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', loadMyProfile);
