#signal 6R (gen) 
#vcc 1R (5V)
#ground...

import RPi.GPIO as GPIO
import time
import sys

def main():
        
        GPIO.setmode(GPIO.BCM)
        #sig 6R
        GPIO.setup(18,GPIO.IN)
        is_tilted=False
        
        while True:
                input_state = GPIO.input(18)
                if input_state == True:
                    if is_tilted == False:
                        is_tilted=True
                        print is_tilted
                else:
                    if is_tilted == True:
                        is_tilted=False
                        print is_tilted
                sys.stdout.flush()
                time.sleep(0.2)

if __name__ == '__main__':
        main()
            
            
        
