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



function show_popup(title, innerHTML) {
    popup.innerHTML = `
<h3 id="popupTitle">${title}</h3>
${innerHTML}
<div class="popup-actions">
    <button id="popupCloseBtn" class="btn" onclick="hide_popup()">Close</button>
</div>
    `;

    popup_overlay.style.display = "flex";
}

function hide_popup() {
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
        if (parent == store_games_container) {
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

function get_game_data_by_id(id) {
    let result = null
    games.forEach(g => {
        if (g.id == id) {
            result = g
        }
    });
    return result
}

function launch_game(game_id) {
    add_notification(`launching`, `<p>Launching game...</p><progress max="100" class="indeterminate"></progress>`)
    const url = `game/${game_id}`; // GET to this URL
    fetch(url, { method: 'GET' })
}

function install_game(game_id) {
    const url = `install_game/${game_id}`; // GET to this URL
    let game_data = get_game_data_by_id(game_id)
    add_notification(`installing_${game_id}`, `<p>Installing ${game_data.title}</p><progress id="progress_bar_${game_id}"></progress>`)
    fetch(url, { method: 'GET' })
}

function handle_indeterminate() {
    document.querySelectorAll("progress.indeterminate").forEach(progress_bar => {
        progress_bar.max = "1";
        progress_bar.value = Math.sin(Date.now() / 600) / 2 + 0.5;
    });
}

function add_notification(id, content) {
    document.getElementById("NotificationOverlay").innerHTML += `
    <div id="notification_${id}" class="notification" role="dialog" aria-modal="true" aria-labelledby="popupTitle">
      ${content}
    </div>
    `
}

let previous_downloads = []

function update_download_status() {
    fetch('/download_progress', {
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
        .then(response => response.json())
        .then(data2 => {
            console.log(data2)
            let update_library = false;
            previous_downloads.forEach(game => {
                if (!(Object.keys(data2).includes(game))) {
                    document.getElementById(`notification_installing_${game}`).remove();
                    update_library = true;
                }
            });
            if (update_library) {
                rerender_library()
            }
            Object.keys(data2).forEach(game_id => {
                console.log(game_id)
                const progressBar = document.getElementById(`progress_bar_${game_id}`);
                if (progressBar) {
                    progressBar.value = data2[game_id].progress;
                }
            });
            previous_downloads = Object.keys(data2)
        });
}


setInterval(update_download_status, 2000);

setInterval(handle_indeterminate, 20);

window.addEventListener("blur", () => {
    document.getElementById("notification_launching").remove()
});

window.addEventListener("focus", () => {
    console.log("Window gained focus");
});



let games = []


async function is_online() {
    if (!navigator.onLine) return false;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        await fetch('https://www.google.com/generate_204', {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-store',
            signal: controller.signal
        });
        clearTimeout(timeout);
        return true;
    } catch (e) {
        return false;
    }
}



function save() {
    console.log("Saving")
    localStorage.setItem("playusb_games", JSON.stringify(games))
}

function load() {
    games = data.game_index;

    games.forEach(g => {
        g.installed = (data.downloaded_games.includes(g.path));
    });

    return true
}


async function rerender_library() {
    let online = await is_online()
    fetch('/game_library', { method: 'GET' })
        .then(response => response.json())
        .then(gl => {
            console.log(gl)
            data.downloaded_games = gl;
            load()
            if (data.downloaded_games.length == 0) {
                document.getElementById("no_games").style.display = "block"
            }
            else {
                document.getElementById("no_games").style.display = "none"
            }
            renderGames(games, installed_games_container);
            document.getElementById("store_empty").style.display = "none"
            if (online) {
                if (games.length - data.downloaded_games.length == 0) {
                    document.getElementById("store_empty").style.display = "block"
                }
                renderGames(games, store_games_container);
                document.getElementById("store_unavailable").style.display = "none";
            }
            else {
                document.getElementById("store_unavailable").style.display = "block";
                store_games_container.style.display = "none";
            }
            applyFilters();
        });
}


// init
(function init() {
    lastSync.textContent = formatDate(new Date());
    // select ALL
    document.querySelector('.chip[data-filter="all"]').style.background = 'rgba(255,255,255,0.02)';
    rerender_library();
})();