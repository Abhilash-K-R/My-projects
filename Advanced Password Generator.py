import random
import string

class AdvancedPasswordGenerator:
    def generate_password(self, length=8, use_uppercase=True, use_lowercase=True, use_digits=True, use_symbols=True):
        characters = ''
        if use_uppercase:
            characters += string.ascii_uppercase
        if use_lowercase:
            characters += string.ascii_lowercase
        if use_digits:
            characters += string.digits
        if use_symbols:
            characters += string.punctuation

        if not characters:
            raise ValueError("Error: No character set selected for password generation.")

        return ''.join(random.choice(characters) for _ in range(length))

def main():
    password_generator = AdvancedPasswordGenerator()

    print("Advanced Password Generator")

    length = int(input("Enter the length of the password: "))
    use_uppercase = input("Include uppercase letters? (yes/no): ").lower() == "yes"
    use_lowercase = input("Include lowercase letters? (yes/no): ").lower() == "yes"
    use_digits = input("Include digits? (yes/no): ").lower() == "yes"
    use_symbols = input("Include symbols? (yes/no): ").lower() == "yes"

    try:
        password = password_generator.generate_password(length, use_uppercase, use_lowercase, use_digits, use_symbols)
        print("Generated Password:", password)
    except ValueError as e:
        print(e)

if __name__ == "__main__":
    main()
