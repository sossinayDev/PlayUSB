const installed_games_container = document.getElementById('content_installed');
const store_games_container = document.getElementById('content_store');
const detailsBox = document.getElementById('detailsBox');
const lastSync = document.getElementById('lastSync');
const popup_overlay = document.getElementById('popupOverlay')
const popup = document.getElementById('popup')



document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !popupOverlay.hidden) {
    hide_popup();
  }
});



function show_popup(title,innerHTML) {
    popup.innerHTML = `
<h3 id="popupTitle">${title}</h3>
${innerHTML}
<div class="popup-actions">
    <button id="popupCloseBtn" class="btn" onclick="hide_popup()">Close</button>
</div>
    `;

    popup_overlay.style.display = "flex";
}

function hide_popup(){
    popup_overlay.style.display = "none";
}

function formatDate(d) {
    return new Date(d).toLocaleString();
}

function renderGames(list, parent) {
    parent.innerHTML = '';
    list.forEach(g => {
        const card = document.createElement('article');
        card.className = 'card';
        card.setAttribute('role', 'listitem');

        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        thumb.innerHTML = `<div style=\"display:flex;flex-direction:column;gap:6px;width:100%\"><strong class=\"title\">${g.title}</strong><span class=\"meta\">${g.genre} • ${g.installed ? 'Installed' : 'Not installed'}</span></div>`;
        if (parent==store_games_container){
            thumb.style.backgroundImage = `url(${data.server}${g.path}/thumb.png)`
        }
        else {
            thumb.style.backgroundImage = `url(static/database/games/${g.path}/thumb.png)`
        }
        thumb.style.backgroundSize = "100%"

        const actions = document.createElement('div');
        actions.className = 'actions';

        let launch = null
        if (g.installed) {
            launch = document.createElement('button');
            launch.className = 'btn primary';
            launch.textContent = 'Launch';
            launch.onclick = () => launch_game(g.id)
        }
        else {
            launch = document.createElement('button');
            launch.className = 'btn install';
            launch.textContent = 'Install';
            launch.onclick = () => install_game(g.id)
        }

        // const info = document.createElement('img');
        // info.className = 'img fav';
        // if (g.favorite) {
        //     info.src = `static/img/star_filled.svg`;
        // }
        // else {
        //     info.src = `static/img/star_empty.svg`;
        // }
        // info.id = `fav_star_${g.id}`
        // info.onclick = () => toggle_favorite(g);

        actions.appendChild(launch);
        // actions.appendChild(info);

        card.appendChild(thumb);
        card.appendChild(actions);

        // quick click on card shows details
        card.addEventListener('click', (e) => {
            // avoid double action when clicking buttons
            if (e.target.tagName.toLowerCase() === 'button') return;
            showDetails(g);
        });

        parent.appendChild(card);
    });
}

function toggle_favorite(g2) {
    let g = games[g2.id - 1]
    console.log(g)
    if (g.favorite == true) {
        console.log("Unsetting")
        g.favorite = false;
        document.getElementById(`fav_star_${g.id}`).src = `static/img/star_empty.svg`;
    }
    else {
        console.log("Adding")
        g.favorite = true;
        document.getElementById(`fav_star_${g.id}`).src = `static/img/star_filled.svg`;
    }
    console.log(g)
    games[g.id - 1] = g
}

function showDetails(game) {
    detailsBox.innerHTML = `
        <div style=\"display:flex;gap:12px;align-items:flex-start\"> 
          <div>
            <div style=\"font-weight:900;font-size:15px\">${game.title}</div>
            <div style=\"font-size:12px;color:rgba(234,244,255,0.8);margin-top:6px\">${game.genre} • ${game.installed ? 'Installed' : 'Not installed'}</div>
            <p style=\"margin-top:8px;font-size:13px;color:rgba(234,244,255,0.75)\">${game.desc}</p>
            <div style=\"display:flex;gap:8px;margin-top:10px\">
            </div>
          </div>
        </div>
      `;
}

// simple filtering/search
const searchInput = document.getElementById('searchInput');
document.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', (e) => {
    document.querySelectorAll('.chip').forEach(c => c.style.background = 'transparent');
    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
    applyFilters();
}));

function applyFilters() {
    const q = (searchInput.value || '').toLowerCase();
    const active = document.querySelector('.chip[style*="background"]');
    const filter = active ? active.dataset.filter : 'all';
    const filtered_installed = games.filter(g => {
        if (!g.installed) return false;
        if (filter === 'favorites' && !g.favorite) return false;
        if (q && !(g.title.toLowerCase().includes(q) || g.genre.toLowerCase().includes(q))) return false;
        return true;
    });
    renderGames(filtered_installed, installed_games_container);
    const filtered_store = games.filter(g => {
        if (g.installed) return false;
        if (filter === 'favorites' && !g.favorite) return false;
        if (q && !(g.title.toLowerCase().includes(q) || g.genre.toLowerCase().includes(q))) return false;
        return true;
    });
    renderGames(filtered_store, store_games_container);
}


function launch_game(game_id) {
    const url = `game/${game_id}`; // GET to this URL
    fetch(url, { method: 'GET' })
}

function install_game(game_id) {
    const url = `install_game/${game_id}`; // GET to this URL
    fetch(url, { method: 'GET' })
}


searchInput.addEventListener('input', applyFilters);
document.getElementById('refreshBtn').addEventListener('click', () => {
    lastSync.textContent = formatDate(new Date());

    console.log("Refreshing game")
});


let games = []


function save() {
    console.log("Saving")
    localStorage.setItem("playusb_games", JSON.stringify(games))
}

function load() {
    // let temp = localStorage.getItem("playusb_games")
    // if (temp != null) {
    //     games = JSON.parse(temp)
    //     if (games && typeof games === 'object' && Array.isArray(games)) {
    //         games = new Proxy(games, {
    //             set: function (target, property, value) {
    //                 target[property] = value;
    //                 save();
    //                 return true;
    //             }
    //         });
    //         return true
    //     }
    // }
    games = data.game_index;

    games.forEach(g => {
        g.installed = (data.downloaded_games.includes(g.path));
    });

    return true
}





// init
(function init() {
    lastSync.textContent = formatDate(new Date());
    // select ALL
    document.querySelector('.chip[data-filter="all"]').style.background = 'rgba(255,255,255,0.02)';
    load();
    renderGames(games, installed_games_container);

    if (navigator.onLine) {
    // if (false) {
        renderGames(games, store_games_container);
    }
    else {
        document.getElementById("store_unavailable").style.display="block";
        store_games_container.style.display = "none";
    }
    applyFilters();
})();