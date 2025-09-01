import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

# You'll need to replace these with your actual credentials
# The best practice is to store your credentials in an environment variable 
# and read it from there as done below, not in the code directly.
cred = credentials.Certificate(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))
firebase_admin.initialize_app(cred)
db = firestore.client()

def main():
    # No need to create a table; Firestore is schemaless
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

