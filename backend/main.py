import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

# Similar to entry.py, this code only works if you have the right credentials.
# Since I am the only user with the credentials, I am the only one who can run this script.
# This script is used for deleting cards and players from the Firestore database.
# This is the only way to delete cards and players from the database.
    # players can be deleted from the web interface when they close the browser but it doesn't always work

cred = credentials.Certificate(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))
firebase_admin.initialize_app(cred)
db = firestore.client()

def main():
    print("Type \"dq\" to delete all questions")
    print("Type \"da\" to delete all answers")
    print("Type \"dall\" to delete all cards")
    print("Type \"dp\" to delete all players\n")
    d = input().strip().lower()
    if d == "dq":
        delete_cards(type=0)  # Delete questions
    elif d == "da":
        delete_cards(type=1)  # Delete answers
    elif d == "dall":
        delete_all_cards()    # Delete all cards
    elif d == "dp":
        delete_players()
    print("Database actions complete")


def delete_cards(type):
    docs = db.collection('cards').where('type', '==', type).stream()
    deleted_count = 0
    for doc in docs:
        doc.reference.delete()
        deleted_count +=1
    print(f"Deleted {deleted_count} cards of type {type}")


def delete_all_cards():
    docs = db.collection('cards').stream()
    deleted_count = 0
    for doc in docs:
        doc.reference.delete()
        deleted_count +=1
    print(f"Deleted {deleted_count} cards")

def delete_players():
    docs = db.collection('players').stream()
    deleted_count = 0
    for doc in docs:
        doc.reference.delete()
        deleted_count += 1
    print(f"Deleted {deleted_count} players")

if __name__ == "__main__":
    main()

