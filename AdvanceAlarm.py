import pygame
import datetime
import time
import tkinter as tk
from tkinter import simpledialog, messagebox

def set_alarm_time():
    root = tk.Tk()
    root.withdraw()
    alarm_time = simpledialog.askstring("Alarm Time", "Enter the time for the alarm (format: HH:MM): ")
    return alarm_time

def set_repeat_option():
    root = tk.Tk()
    root.withdraw()
    repeat = messagebox.askyesno("Repeat", "Do you want the alarm to repeat daily?")
    return repeat

def set_snooze_duration():
    root = tk.Tk()
    root.withdraw()
    snooze_duration = simpledialog.askinteger("Snooze", "Enter snooze duration in minutes: ")
    return snooze_duration

def play_alarm_sound():
    pygame.mixer.init()
    pygame.mixer.music.load("alarm_sound.mp3")
    pygame.mixer.music.play()
    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(10)

def main():
    alarm_time = set_alarm_time()
    repeat = set_repeat_option()
    snooze_duration = set_snooze_duration()
    while True:
        current_time = datetime.datetime.now().strftime("%H:%M")
        if current_time == alarm_time:
            print("Wake up! It's time!")
            play_alarm_sound()
            if repeat:
                tomorrow = datetime.datetime.now() + datetime.timedelta(days=1)
                alarm_time = tomorrow.strftime("%H:%M")
            else:
                break
        else:
            print("Current time: " + current_time)
            time.sleep(60)  # Check every minute

if __name__ == "__main__":
    main()

