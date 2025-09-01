import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
import firebase_admin
from firebase_admin import credentials, firestore
import os

cred = credentials.Certificate(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))
firebase_admin.initialize_app(cred)
db = firestore.client()

def add_card():
    card_type = card_type_var.get()
    card_text = card_text_entry.get("1.0", tk.END).strip()

    if not card_text:
        messagebox.showerror("Input Error", "Please enter card text.")
        return

    try:
        data = {'query': card_text, 'type': 0 if card_type == "question" else 1,'createdAt': firestore.SERVER_TIMESTAMP}
        db.collection('cards').add(data)
        card_text_entry.delete("1.0", tk.END)
        show_questions()
        show_answers()
    except Exception as e:
        messagebox.showerror("Error", f"An error occurred: {e}")

def show_questions():
    questions_listbox.delete(0, tk.END)
    try:
        docs = db.collection('cards').where('type', '==', 0).stream()
        questions = [doc.to_dict()['query'] for doc in docs]
        if not questions:
            questions_listbox.insert(tk.END, "No questions found.")
        else:
            for q in questions:
                questions_listbox.insert(tk.END, q)
    except Exception as e:
        messagebox.showerror("Error", f"An error occurred: {e}")

def show_answers():
    answers_listbox.delete(0, tk.END)
    try:
        docs = db.collection('cards').where('type', '==', 1).stream()
        answers = [doc.to_dict()['query'] for doc in docs]
        if not answers:
            answers_listbox.insert(tk.END, "No answers found.")
        else:
            for a in answers:
                answers_listbox.insert(tk.END, a)

    except Exception as e:
        messagebox.showerror("Error", f"An error occurred: {e}")

def delete_last():
    try:
        docs = db.collection('cards').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(1).stream()
        last_doc = list(docs)[0]
        last_doc.reference.delete()
        show_questions()
        show_answers()
        #messagebox.showinfo("Success", "Last card deleted successfully!")
    except IndexError:  # Handles case where there are no documents (empty collection)
        messagebox.showinfo("Info", "No cards to delete.")
    except Exception as e:  # Catch other potential errors
        messagebox.showerror("Error", f"An error occurred: {e}")



back = "#1E1E1E"
txt = "#D4D4D4"
text_bg = "#333333"

highlight = "#000000"  # Highlight color (coral) for selected state
selected_bg = "#666666"  # Background color when selected

deselected_bg = "#444444"

# Set up the GUI window
window = tk.Tk()
window.title("Card Game Database")
window.geometry("750x700")
window.config(bg=back)

# Add the card type radio buttons
card_type_var = tk.StringVar(value="question")
tk.Label(window, text="Select Card Type:",fg = txt, bg = back, font = ("Arial", 12)).pack()
# Create the radio buttons with color customization
tk.Radiobutton(
    window, 
    text="Question", 
    fg=txt, 
    bg=deselected_bg,  # Background color when not selected
    activeforeground=highlight, 
    variable=card_type_var, 
    value="question", 
    font=("Arial", 12),
    indicatoron=False,         # Turn off the default indicator (circle)
    width=20,                  # Set width for the button-like appearance
    relief="solid",            # Solid border to make the button look more defined
    activebackground=selected_bg,  # Background color when the button is selected
    selectcolor=selected_bg    # Color when the radio button is selected
).pack(pady=5)

tk.Radiobutton(
    window, 
    text="Answer", 
    fg=txt, 
    bg=deselected_bg,  # Background color when not selected
    activeforeground=highlight, 
    variable=card_type_var, 
    value="answer", 
    font=("Arial", 12),
    indicatoron=False,         # Turn off the default indicator (circle)
    width=20,                  # Set width for the button-like appearance
    relief="solid",            # Solid border to make the button look more defined
    activebackground=selected_bg,  # Background color when the button is selected
    selectcolor=selected_bg    # Color when the radio button is selected
).pack(pady=5)

# Add text entry box for card text
tk.Label(window, text="Enter card text:", fg = txt, bg = back, font = ("Arial", 12)).pack()
card_text_entry = tk.Text(window, height=5, width=60, wrap=tk.WORD, fg = "black", bg = "white", font = ("Arial", 10)) # Height controls lines
card_text_entry.pack()

# Add buttons for actions
tk.Button(window, text="Add Card", command=add_card,fg = txt, bg = back, font = ("Arial", 10),width=15).pack()
tk.Button(window, text="Delete Last Card", command=delete_last,fg = txt, bg = back, font = ("Arial", 10),width=15).pack()

tk.Label(window, text="List of Questions:",fg = txt, bg = back, font = ("Arial", 12)).pack()
questions_listbox = tk.Listbox(window, width=100, height=10, fg=txt, bg = text_bg)
questions_listbox.pack()

tk.Label(window, text="List of Answers:",fg = txt, bg = back, font = ("Arial", 12)).pack()
answers_listbox = tk.Listbox(window, width=100, height=10, fg=txt, bg = text_bg)
answers_listbox.pack()
show_answers()
show_questions()
# Start the GUI event loop
window.mainloop()
