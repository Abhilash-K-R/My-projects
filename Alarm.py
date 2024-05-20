import pygame
import datetime
import time

def set_alarm_time():
    print("Enter the time for the alarm (format: HH:MM): ")
    alarm_time = input()
    return alarm_time

def play_alarm_sound():
    pygame.mixer.init()
    pygame.mixer.music.load("alarm_sound.mp3")
    pygame.mixer.music.play()
    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(10)

def main():
    alarm_time = set_alarm_time()
    while True:
        current_time = datetime.datetime.now().strftime("%H:%M")
        if current_time == alarm_time:
            print("Wake up! It's time!")
            play_alarm_sound()
            break
        else:
            print("Current time: " + current_time)
            time.sleep(60)  # Check every minute

if __name__ == "__main__":
    main()


