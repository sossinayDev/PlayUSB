from flask import Flask
from socket import gethostname
import json
import requests
import time
import asyncio
from threading import Thread


game_server = "https://raw.githubusercontent.com/sossinayDev/PlayUSB/refs/heads/main/USB/files/static/database/"

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


stick_info = default_stick_info
games = {}



def save_stick_info():
    global stick_info
    json.dump(stick_info, open("stick_info.json", "w"))




# Try to update games
try:
    response = requests.get(game_server+"games.json")
    if response.status_code == 200:
        with open("static/database/games.json", "w") as f:
            f.write(response.text)
            just_updated = True
            print("Updated game library")
except:
    print("Failed to update game library")


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
    
    text = open('dashboard.html', encoding='utf-8').read().replace("{HOSTNAME}", gethostname())
    text = text.replace("{ INSERTION_DATA }", json.dumps(insertion_data))
    text = text.replace("{ADDITIONAL_PATH}", additional_path)

    return text

def return_redirect(new_path):
    base = """
    <script>window.onload = () => {window.location.href = "{new_path}"}</script>
    """
    return base.replace("{new_path}", new_path)


@app.route('/')
@app.route('/index.html')
def index():
    return get_dashboard()

@app.route('/game/<game_id>')
def serve_game(game_id):
    return open(f'games/{game_id}/game.html', encoding='utf-8').read()

@app.route('/install_game/<game_id>')
def install_game(game_id):
    download_queue.append(game_id)
    return return_redirect("../")

@app.route('/uninstall_game/<game_id>')
def uninstall_game(game_id):
    return return_redirect("../")


if __name__ == '__main__':

    def run_app():
        app.run(debug=True, use_reloader=False)

    Thread(target=run_app).start()

    # You can add your async download process here
    async def download_process():
        while True:
            # Implement your downloading logic here
            if len(download_queue) > 0:
                current_download = int(download_queue[0])
                current_download_data = games["game_index"][current_download-1]
                print(f"Downloading {current_download_data['title']}...")
                url = game_server + "games/"+current_download_data['path']+"/"
                try:
                    print("Getting:"+url+"/meta.json")
                    meta = json.loads(requests.get(url+"/meta.json").text())
                    print(meta)
                except:
                    print("Failed to download")
                    download_queue.pop(0)
                
            await asyncio.sleep(1)


    asyncio.run(download_process())