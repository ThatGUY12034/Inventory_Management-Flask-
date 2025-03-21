from flask import Flask, render_template
import bcrypt
from flask import Flask, request, render_template, redirect, url_for, flash
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)
app.secret_key = 'your_secret_key'

cred = credentials.Certificate("serviceAccountkey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/inventory')
def inventory():
    inventory_items = [
        {"name": "Laptop", "category": "Electronics", "stock": 10},
        {"name": "Notebook", "category": "Stationery", "stock": 3},
        {"name": "Printer", "category": "Office Equipment", "stock": 5},
        {"name": "Desk Chair", "category": "Furniture", "stock": 1},
    ]
    return render_template('inventory.html', inventory=inventory_items)

@app.route('/Sales')
def Sales():
    return render_template('Sales.html')
    
@app.route('/Login')
def Login():
    return render_template('Login.html')

@app.route('/Register', methods=['GET','POST'])
def Register():
     if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            return redirect(url_for('Register'))

        # Check if user already exists
        users_ref = db.collection('users')
        existing_user = users_ref.where("email", "==", email).get()

        if existing_user:
            flash('Email already registered!', 'warning')
            return redirect(url_for('Register'))

        # Hash the password before storing
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Store user in Firestore
        users_ref.add({
            'username': username,
            'email': email,
            'password': hashed_password.decode('utf-8')  # Store as a string
        })

        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('Login'))

     return render_template('Register.html')

@app.route('/Orders')
def Orders():
    return render_template('Orders.html')

@app.route('/Members')
def Members():
    return render_template('Members.html')

@app.route('/Reports')
def Reports():
    return render_template('Reports.html')


if __name__ == '__main__':
    app.run(debug=True)
