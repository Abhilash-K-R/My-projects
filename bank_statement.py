class BankAccount:
    def __init__(self, account_number, balance, password):
        self.account_number = account_number
        self.balance = balance
        self.password = password

    def deposit(self, amount):
        self.balance += amount
        print(f"Deposited {amount} into account No. {self.account_number}.")

    def withdraw(self, amount):
        if amount <= self.balance:
            self.balance -= amount
            print(f"Successfully Withdrew {amount} from account No. {self.account_number}.")
        else:
            print("Insufficient funds.")

    def display_balance(self):
        print(f"Account No. {self.account_number} balance: {self.balance}")

    def set_password(self, new_password):
        self.password = new_password
        print("Password set successfully.")

    def authenticate(self, password):
        return self.password == password

def main():
    account1 = BankAccount("12345", 1000, "password1")
    account2 = BankAccount("67890", 500, "password2")

    while True:
        print("\nBank Statement Menu:")
        print("1. Deposit")
        print("2. Withdraw")
        print("3. Display Balance")
        print("4. Set Password")
        print("5. Exit")

        choice = input("Enter your choice: ")

        if choice == "1":
            amount = float(input("Enter amount to deposit: "))
            account_number = input("Enter account number: ")
            if account_number == account1.account_number:
                account1.deposit(amount)
            elif account_number == account2.account_number:
                account2.deposit(amount)
            else:
                print("Invalid account number.")
        elif choice == "2":
            amount = float(input("Enter amount to withdraw: "))
            account_number = input("Enter account number: ")
            password = input("Enter password: ")
            if account_number == account1.account_number:
                if account1.authenticate(password):
                    account1.withdraw(amount)
                else:
                    print("Incorrect password.")
            elif account_number == account2.account_number:
                if account2.authenticate(password):
                    account2.withdraw(amount)
                else:
                    print("Incorrect password.")
            else:
                print("Invalid account number.")
        elif choice == "3":
            account_number = input("Enter account number: ")
            password = input("Enter password: ")
            if account_number == account1.account_number:
                if account1.authenticate(password):
                    account1.display_balance()
                else:
                    print("Incorrect password.")
            elif account_number == account2.account_number:
                if account2.authenticate(password):
                    account2.display_balance()
                else:
                    print("Incorrect password.")
            else:
                print("Invalid account number.")
        elif choice == "4":
            account_number = input("Enter account number: ")
            password = input("Enter current password: ")
            if account_number == account1.account_number:
                if account1.authenticate(password):
                    new_password = input("Enter new password: ")
                    account1.set_password(new_password)
                else:
                    print("Incorrect password.")
            elif account_number == account2.account_number:
                if account2.authenticate(password):
                    new_password = input("Enter new password: ")
                    account2.set_password(new_password)
                else:
                    print("Incorrect password.")
            else:
                print("Invalid account number.")
        elif choice == "5":
            print("Exiting...")
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
