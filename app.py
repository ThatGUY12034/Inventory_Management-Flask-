from flask import Flask, render_template

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run(debug=True)
