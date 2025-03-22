from flask import Flask, render_template, session
import bcrypt
from flask import Flask, request, render_template, redirect, url_for, flash ,jsonify
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)
app.secret_key = 'your_secret_key'

cred = credentials.Certificate("serviceAccountkey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

data = {
    "users": ["John Doe", "Jane Smith", "Alice Brown"],
    "inventory": ["Laptop", "Phone", "Tablet"],
    "orders": ["Order #123", "Order #456"],
    "sales": ["Sale #001", "Sale #002"]
}


@app.route('/')
def index():
    if "user" not in session or session["user"] is None:  # 🔹 Ensure proper session check
        return redirect(url_for('Login'))  
    
    

    # Fetch inventory summary from Firestore
    summary_ref = db.collection('inventory_summary').document('dashboard')
    summary_data = summary_ref.get().to_dict()
    
    # Fetch product details
    product_ref = db.collection('product_details')
    product_data = {doc.id: doc.to_dict() for doc in product_ref.stream()}
    
    # Fetch top-selling items
    top_selling_ref = db.collection('top_selling')
    top_selling_data = [doc.to_dict() for doc in top_selling_ref.stream()]
    
    # Fetch purchase order
    purchase_ref = db.collection('purchase_order').document('this_month')
    purchase_data = purchase_ref.get().to_dict()
    
    # Fetch sales order
    sales_ref = db.collection('sales_order')
    sales_data = {doc.id: doc.to_dict() for doc in sales_ref.stream()}
    
    return render_template('index.html',
                           summary=summary_data,
                           products=product_data,
                           top_selling=top_selling_data,
                           purchase=purchase_data,
                           sales=sales_data)
@app.route("/search", methods=["GET"])
def search():
    query = request.args.get("q", "").lower()
    results = {}

    if query:
        for key, items in data.items():
            matched_items = [item for item in items if query in item.lower()]
            if matched_items:
                results[key] = matched_items

    return jsonify(results)
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
    
@app.route("/Login", methods=["GET", "POST"])
def Login():
    if request.method == "POST":
        name = request.form.get("name")
        password = request.form.get("password")

        print(f"📩 Login Attempt: {name}")  # Debugging line

        # 🔍 Query Firestore for username
        users_ref = db.collection("users").where("username", "==", name).stream()

        user_doc = None
        for doc in users_ref:
            user_doc = doc.to_dict()
            break  # Take the first matching user

        if user_doc:
            stored_hashed_password = user_doc["password"]  # Get hashed password from Firestore

            # 🔑 Verify password
            if bcrypt.checkpw(password.encode("utf-8"), stored_hashed_password.encode("utf-8")):
                session["user"] = name
                flash("Login successful!", "success")
                return redirect(url_for("index"))  # Redirect to home
            else:
                flash("❌ Incorrect password!", "danger")
        else:
            flash("❌ User not found!", "danger")

    return render_template("Login.html")

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

@app.route('/logout')
def logout():
    session.pop('user', None)  # Clear user session
    flash("You have been logged out.", "info")  # Optional flash message
    return redirect(url_for('Login'))  # Redirect to Login page

if __name__ == '__main__':
    app.run(debug=True)
