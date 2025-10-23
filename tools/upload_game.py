import zipfile
import json
import os
import random
from shutil import copytree


data = json.load(open("../library/games.json"))

game_id = len(data["game_index"])+1

path = "unknown_game_"+str(random.randint(11111,99999))
l = os.listdir(".")
for p in l:
    if os.path.isdir(p) and p != "upload_game.py":
        path = p
        break



files = os.listdir(path)
print("\n\nPlease select the executable file:")
i = 0
for file in files:
    print(f"  [{i+1}] {file}")
    i += 1
ans = int(input("Index: "))-1
file = files[ans]

if not "thumb.png" in files:
    if input("Warning! No thumbnail found. Are sure about continuing? (y/n) ") != "y":
        exit(0)

print("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n====================================================")
print(f"Adding game with id [{game_id}], path: {path}")
print("The executable file is: "+file)
title = input("Game title: ")
genre = input("Game genre: ")
game_type = "win" if file.endswith(".exe") else "html" if file.endswith(".html") or file.endswith(".html5") else "Unknown"
print("Game type: "+game_type)
creator = input("Game creator: ")
url = input("Game url: ")
desc = input("Game description:\n")+f'\n\n© <a href="{url}">{creator}</a>'
print(f"\n© {creator}")
print("====================================================")

meta = {
    "type": game_type,
    "execute": file,
    "files": {}
}

for f in files:
    meta["files"][f] = {
        "type": "thumbnail" if f == "thumb.png" else "game" if f == file else "asset"
    }

game_data = {
    "id": game_id,
    "path": path,
    "title": title,
    "genre": genre,
    "installed": False,
    "favorite": False,
    "desc": desc
}

data["game_index"].append(game_data)
json.dump(data, open("../library/games.json","w"))


json.dump(meta, open(f"{path}/meta.json", "w"))

copytree(path, f"../library/{path}")

