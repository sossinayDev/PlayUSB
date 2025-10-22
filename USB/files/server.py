from flask import Flask
from socket import gethostname
import json


app = Flask("playusb")


data = json.load(open("static/database/games.json"))

def get_dashboard(additional_path: str = ""):
    insertion_data = data
    
    text = open('dashboard.html', encoding='utf-8').read().replace("{HOSTNAME}", gethostname())
    text = text.replace("{INSERTION_DATA}", json.dumps(insertion_data))
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
    return return_redirect("../")

@app.route('/uninstall_game/<game_id>')
def uninstall_game(game_id):
    return return_redirect("../")

@app.route('/update')
def uninstall_game():
    return return_redirect("/")

if __name__ == '__main__':
    app.run(debug=True)