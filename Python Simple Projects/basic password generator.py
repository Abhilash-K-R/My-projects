import random
import string

class PasswordGenerator:
    def generate_password(self, length=8):
        characters = string.ascii_letters + string.digits + string.punctuation
        return ''.join(random.choice(characters) for _ in range(length))

def main():
    password_generator = PasswordGenerator()

    print("Password Generator")

    length = int(input("Enter the length of the password: "))

    if length <= 0:
        print("Error: Length must be a positive integer.")
        return

    password = password_generator.generate_password(length)
    print("Generated Password:", password)

if __name__ == "__main__":
    main()
