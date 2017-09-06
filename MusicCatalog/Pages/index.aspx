<!DOCTYPE html>
<html data-ng-app="musicApp">
<head>
    <title></title>
    <meta charset="utf-8" />
    <link href="../Content/bootstrap.css" rel="stylesheet" />
    <link href="../Content/App.css" rel="stylesheet" />
    <script src="../Scripts/jquery-1.9.1.js"></script>
    <script src="../Scripts/bootstrap.js"></script>
    <script src="../Scripts/angular.js"></script>
    <script src="../Scripts/angular-ui/ui-bootstrap-tpls.js"></script>
    <script src="../Scripts/angular-route.js"></script>
    <script src="../Scripts/app.js"></script>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <div class="col-xs-12">
                <span class="glyphicon glyphicon-headphones hidden-xs" style="color:red">
                </span>Music Artists
            </div>
        </div>
        <div class="row">
            <div class="col-xs-12">
                <div data-ng-view></div>
            </div>
        </div>
    </div>
</body>
</html>