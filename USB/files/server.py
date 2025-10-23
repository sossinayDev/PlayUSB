from flask import Flask
from socket import gethostname
import json
import requests
import time
import asyncio
from threading import Thread
import os
import subprocess


game_server = "https://raw.githubusercontent.com/sossinayDev/PlayUSB/refs/heads/main/library/"

download_queue = []

default_stick_info = {
    "user_history": [],
    "history": [],
    "name": [],
    "last_logon": -1,
    "first_logon": -1
}


app = Flask("playusb")

just_updated = False
new_device = False
new_stick = False
no_games = False

is_linux = os.name == 'posix'

def get_game_list():
    result = []
    try:
        base = os.listdir("static/database/games/")
        for game in base:
            if os.path.exists("static/database/games/"+game+"/meta.json"):
                result.append(game)
        return result
    except FileNotFoundError:
        return []
    else:
        pass

stick_info = default_stick_info
games = {}
downloaded_games = []
downloaded_games = get_game_list()


def save_stick_info():
    global stick_info
    json.dump(stick_info, open("stick_info.json", "w"))




# Try to update games
try:
    url = game_server + "games.json"
    # force fresh fetch (bypass caches) by adding a timestamp query param and no-cache headers
    url_no_cache = f"{url}?_={int(time.time()*1000)}"
    print(url_no_cache)
    headers = {"Cache-Control": "no-cache", "Pragma": "no-cache"}
    response = requests.get(url_no_cache, headers=headers, timeout=10)
    if response.status_code == 200:
        os.makedirs("static/database/", exist_ok=True)
        with open("static/database/games.json", "w", encoding="utf-8") as f:
            f.write(response.text)
        just_updated = True
        print("Updated game library")
    else:
        print(f"Failed to update game library: HTTP {response.status_code}")
except Exception as e:
    print("Failed to update game library:", e)


# Try to load games
try:
    games = json.load(open("static/database/games.json"))
    print("Loaded local game library")
except:
    no_games = True
    print("No games found")


# Try to load stick information
try:
    stick_info = json.load(open("stick_info.json"))
    print("Loaded stick info")
except:
    new_stick = True
    stick_info["first_logon"] = int(time.time()*1000)
    print("Welcome! This seems to be a new PlayUSB-Stick!")


if not gethostname() in stick_info["user_history"]:
    print("Hello! New Device detected. Have fun playing!")
    new_device = True
    stick_info["user_history"].append(gethostname())
    save_stick_info()


stick_info["last_logon"] = int(time.time()*1000)
save_stick_info()




def get_dashboard(additional_path: str = ""):
    insertion_data = games
    insertion_data["stick_info"] = stick_info
    insertion_data["just_updated"] = just_updated
    insertion_data["new_device"] = new_device
    insertion_data["new_stick"] = new_stick
    insertion_data["no_games"] = no_games
    insertion_data["server"] = game_server
    insertion_data["downloaded_games"] = get_game_list()
    
    text = open('dashboard.html', encoding='utf-8').read().replace("{HOSTNAME}", gethostname())
    text = text.replace("{ INSERTION_DATA }", json.dumps(insertion_data))
    text = text.replace("{ADDITIONAL_PATH}", additional_path)

    return text

def return_redirect(new_path):
    base = """
    <script>window.onload = () => {window.location.href = "{new_path}"}</script>
    """
    return base.replace("{new_path}", new_path)

def get_game_data_with_id(id):
    id = int(id)
    for game in games["game_index"]:
        if game["id"] == id:
            return game
    return None


@app.route('/')
@app.route('/index.html')
def index():
    return get_dashboard()

@app.route('/game/<game_id>')
def serve_game(game_id):
    data = get_game_data_with_id(game_id)
    if data == None:
        return ""
    path = f"static/database/games/{data['path']}/"
    meta = json.load(open(path+"meta.json"))
    if meta["type"] == "web":
        game = os.path.abspath(path+meta["execute"])
        print(f"Executing command: "+f'\"{game}\"')
        subprocess.run(f'\"{game}\"', shell=True)
    elif meta["type"] == "win":
        game = os.path.abspath(path+meta["execute"])
        if is_linux:
            print(f"Executing command: wine {game}")
            subprocess.run(f'wine "{game}"', shell=True)
        else:
            print(f"Executing command: {game}")
            subprocess.run(f'"{game}"', shell=True)

    return ""

@app.route('/install_game/<game_id>')
def install_game(game_id):
    download_queue.append(game_id)
    return return_redirect("../")

@app.route('/uninstall_game/<game_id>')
def uninstall_game(game_id):
    return return_redirect("../")

@app.route('/game_library')
def serve_game_library():
    return get_game_list()

@app.route('/kb_used')
def get_size():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if not os.path.exists(base_dir):
        return "0"
    total = 0
    for dirpath, dirnames, filenames in os.walk(base_dir):
        for fname in filenames:
            fp = os.path.join(dirpath, fname)
            try:
                total += os.path.getsize(fp)
            except OSError:
                pass
    kb = total // 1024
    return str(kb)

@app.route('/download_progress')
def get_progress():
    d = {
        "downloads": {}
    }
    for game in download_queue:
        d[game] = {
            "current": game == download_queue[0],
            "progress": download_progress if game == download_queue[0] else 0
        }
    return d


current_download = 0
current_download_data = {}
download_progress = 0
if __name__ == '__main__':
    import signal
    
    async def main():
        flask_thread = Thread(target=lambda: app.run(debug=True, use_reloader=False))
        flask_thread.daemon = True
        flask_thread.start()

        try:
            while True:
                global download_progress
                if len(download_queue) > 0:
                    current_download = int(download_queue[0])
                    current_download_data = get_game_data_with_id(current_download)
                    print(f"Downloading {current_download_data['title']}...")
                    download_progress = 0
                    url = game_server + current_download_data['path']+"/"
                    try:
                        print("Getting:"+url+"meta.json")
                        meta = json.loads(requests.get(url+"/meta.json").text)
                        meta["files"]["meta.json"] = {
                            "type": "metadata"
                        }
                        download_progress = 0.1
                        print(meta)
                        target_files = list(meta["files"].keys())
                        i = 0
                        for file in target_files:
                            path = url+file
                            destination = f"static/database/games/{current_download_data['path']}/"+file
                            resp = requests.get(path, stream=True, timeout=20)
                            if resp.status_code != 200:
                                raise Exception(f"Failed to fetch {path}: HTTP {resp.status_code}")

                            os.makedirs(os.path.dirname(destination), exist_ok=True)
                            with open(destination, "wb") as fh:
                                for chunk in resp.iter_content(chunk_size=8192):
                                    if chunk:
                                        fh.write(chunk)
                            print(f"Downloaded: {destination}")
                            download_progress = i / len(target_files) * 0.8 + 0.1
                            
                            # If all files processed, remove from queue
                            if file == target_files[-1]:
                                print(f"Finished downloading {current_download_data['title']}")
                                download_queue.pop(0)
                                download_progress = 1
                            i += 1
                    except:
                        print("Failed to download")
                        download_queue.pop(0)
                    
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down gracefully...")

    # Handle Ctrl+C using the default handler so KeyboardInterrupt is raised
    signal.signal(signal.SIGINT, signal.default_int_handler)
    asyncio.run(main())