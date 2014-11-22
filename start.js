var nba = require('nba');
var fs = require('fs');
var _ = require('underscore');
var Handlebars = require('handlebars');
var moment = require('moment');
var mkdirp = require('mkdirp');
require('./helpers');

var GAME_STATUS_FINAL = 3;

nba.ready(function() {
    var argLength = process.argv.length;
    if (argLength < 3 ) {
        console.log("Please pass a team name.  For instance 'Spurs'");
        throw "error";
    }
    var teamName = process.argv[2];
    if ( !teamName ) {
        console.log("Please pass a team name");
        throw new Exception("Please pass a team name");
    }
    var team = _.find(nba.teamsInfo, function(team) {
        return team.simpleName.toUpperCase() == teamName.toUpperCase()
    });
    console.log("Looking up last game for ", team.teamName);
    global.team = team;

    var date = argLength > 3 ? moment(process.argv[3]).toDate() : new Date();

    getLastGameForTeam(team.teamId, date, function(game) {

        nba.api.boxScoreFourFactors({gameId: game.gameId})
            .then(outputFourFactors);


    });
});

function getLastGameForTeam(teamId, date, callback) {
    if (!date) {
        date = new Date();
    }

    nba.api.scoreboard({ GameDate: moment(date).format('MM/DD/YYYY') }).then(function(resp) {
        var teamGame = _.find(resp.gameHeader, function(game){
            return game.homeTeamId == teamId || game.visitorTeamId == teamId
        });
        if ( !teamGame || teamGame.gameStatusId != GAME_STATUS_FINAL ) {
            date = moment(date).subtract(1, 'days').toDate();
            getLastGameForTeam(teamId, date, callback);
        } else {
            global.date = date;
            callback(teamGame);
        }
    });

}


function outputFourFactors(resp) {
    var template = Handlebars.compile(fs.readFileSync('./templates/fourFactors.hbs', "utf8"));
    var fourFactors = resp.sqlTeamsFourFactors;

    console.log("our team", global.team);
    var ourTeam = _.findWhere(fourFactors, {teamId: global.team.teamId});
    var theirTeam = _.without(fourFactors, ourTeam)[0];
    var data = ourTeam;
    data.opponentName = theirTeam.teamName;
    console.log(data);
    var html = template(data);
    console.log("html", html);
    mkdirp(getDirectoryName(), function(err) {
        fs.writeFile(getDirectoryName() + 'fourFactors.html', html);
    });
}

function getDirectoryName() {
    return './output/' + global.team.teamName + '/' + moment(global.date).format('MM-DD-YYYY') + '/';
}