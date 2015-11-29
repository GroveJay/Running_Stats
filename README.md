# Running_Stats
This repo has two main components:
-- A python script to pull running data from Strava (/python/main.py)
-- A D3.js based web view for the data (/index.html)

### Python instructions:
Setup:
Install strava-lib through pip
```sh
$ pip3 install strava-lib
```
If it yells at you, install any prerequisites mentioned in the output
The script requires four things to complete setup:
- ClientId
- ClinetSecret
- AccessToken
- ClientCode

In your strava profile > Settings > My API Application you can set up an application to request data from strava's APIs. The application you create will give you an **Client Id**, **ClientSecret**, and **Access Token**. By using the instructions from Strava [here](http://strava.github.io/api/v3/oauth/) you can send requests via curl to get the **ClientCode**.

After having all of these set in the python/main.py, you can run the script to produce data.json, a file containing all the details of your strava runs. Putting this file into the /js folder will allow the webview to run.

### webview ###
The webview contains three distinct views for your running data. These views are based around a date and goal pace defined at the top of common.js. The date determines what run data to filter to and the goal pace determines the coloring of the run data in each view.
##### Mile Splits #####
This visualizes each run's individual splits. Hovering over a split will highlight other splits on runs that had that split time for that mile. Clicking on a split highlights all splits for the included runs listed at the bottom.

##### Pace vs Distance #####
This visualizes the pace of each run via a scatterplot of the runs distance and duration. Hovering over a run highlights the run, displaying the exact distance and duration of the run. Clicking on the run brings up a tooltip with more details of the run (pace, distance, duration, splits).

##### Time #####
This view plots individual runs duration, distance, and pace over your training timeline. Hovering over the line displays the data for an individual run over their respective plot, and clicking on a run shows its data like the previous Pace vs Distance view.