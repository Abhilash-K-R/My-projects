import time

def intro():
    print("Welcome to the Text Adventure Game!")
    time.sleep(1)
    print("You find yourself in a mysterious forest.")
    time.sleep(1)
    print("Your goal is to find the treasure hidden deep within the forest.")
    time.sleep(1)
    print("Good luck!\n")

def explore_forest():
    print("You start exploring the forest...")
    time.sleep(1)
    print("You come across a fork in the path.")
    time.sleep(1)
    print("Do you go left or right?")
    choice = input("Enter 'left' or 'right': ").lower()
    if choice == "left":
        print("You chose to go left.")
        time.sleep(1)
        print("You encounter a pack of wolves!")
        time.sleep(1)
        print("You have to fight them off!")
        # Add code for a combat scenario
    elif choice == "right":
        print("You chose to go right.")
        time.sleep(1)
        print("You find a hidden cave.")
        time.sleep(1)
        print("Do you enter the cave or keep exploring?")
        choice = input("Enter 'enter' or 'explore': ").lower()
        if choice == "enter":
            print("You enter the cave...")
            time.sleep(1)
            print("You find a treasure chest!")
            time.sleep(1)
            print("Congratulations, you found the treasure!")
        elif choice == "explore":
            print("You decide to keep exploring the forest.")
            # Add more scenarios for exploration
        else:
            print("Invalid choice!")
            explore_forest()
    else:
        print("Invalid choice!")
        explore_forest()

def main():
    intro()
    explore_forest()

if __name__ == "__main__":
    main()
