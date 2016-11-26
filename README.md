# Running_Stats
This repo has three main components:

- A python server to pull running data from Strava (/python/main.py)
- A D3.js based web view for the data (/index.html)
- A Babylon.js based 3D view for individual activities (/3d.html)

### Python instructions:
Setup:
Install strava-lib, werkzeug, and PyCrypto through pip

If it yells at you, install any prerequisites mentioned in the output
The script requires two things to complete setup:
- AppId
- AppSecret

In your strava profile > Settings > My API Application you can set up an application to request data from strava's APIs. The application you create will give you an **AppId** (Client Id) and **AppSecret** (ClientSecret). The python server is designed to run alongside whatever is serving up the http (in my case i used nginx).

After having these set in the python/main.py, you can run the server which can respond to requests for users' data files in the form ```<userid>_data.json```

### index.html ###
The webview contains seven views for your running data. Some of these views use a goal pace defined at the top of common.js to determine graph scaling and coloring. The date range on the menu determines what run data to filter for and the selector at the top determines if you are viewing running or biking data.

#### Mile Splits ####
This visualizes each run's individual splits. Hovering over a split will highlight other splits on activities that had that split time for that mile. Clicking on a split highlights all splits for the included activities listed at the bottom.

#### Duration vs Distance ####
This visualizes the pace of each run on a scatterplot of distance vs duration. Hovering over a run highlights the run, displaying the distance and duration of the run. Clicking on the run brings up a tooltip view described below.

#### Timeline ####
This view plots individual activities duration, distance, and pace over your training timeline. Hovering over the line displays the data for an individual run over their respective plot, and clicking on a run shows its data in a tooltip like the previous Pace vs Distance view.

#### Time Circles ####
This view was stolen from [Sisu](https://www.madewithsisu.com/). It shows each activity as an arc, starting from the angle on a clock for time the activity started and ending at the activity's end. Activities that go for longer than an hour are marked in blue. Each activity can be selected for the tooltip view.

#### Paths ####
This view was also stolen from [Sisu](https://www.madewithsisu.com/). It shows each activity as a gps path, all scaled to fit in equal-sized boxes. The start of each run is a filled in circle and the end is an empty circle. Each run's box can be selected for the tooltip view. This view has some bugs, idk.

#### Calendar ####
This view was stolen from [VeloViewer](https://www.veloviewer.com). It shows each activity as a square on a calendar. Activities are colored for the range of distances covered in the activities within the filtered date range.

#### Cumulative ####
This view was also stolen from [VeloViewer](https://www.veloviewer.com). It shows the cumulative mileage for all activities grouped by year. You can click the title of the graph to change the view to display each line in a cumulative fashion (each year cumulating into the next).

#### The Tooltip ####
The tooltip view shows more details of the activity (pace, distance, duration, splits). This view also has a links in the top to the strava page for the activity and a link to 3d.html with arguments that will load for that activity.

### 3d.html ###
This view needs arguments in the form of the anchor link in the url. The anchor should be in the form of ```#<activityId>-<userId>```. The 3d view uses babylon.js and a custom scripts to map a ribbon of the activity's gps track and a 3d overlay of the terrain. The elevation profiles for the terrain are taken from [Mapzen](https://mapzen.com/) and the tiles are from [Mapbox](www.mapbox.com). You'll need to put your api key for Mapbox in /3d/custom.js towards the end of the ```CustomVertexTiledGroundFromTerrariumHeightMap()```, and change the map url in /3d/customMeshBuilder.js in ```CustomMeshBuilderCreateTiledGroundFromTerrariumHeightMap()```. This view was somewhat stolen from [VeloViewer](https://www.veloviewer.com). This will crash on very large runs, bummer.