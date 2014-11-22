var nba = require('nba');
var fs = require('fs');
var _ = require('underscore');
var Handlebars = require('handlebars');
var moment = require('moment');
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
    console.log("Looking up last game for team", team, team.teamId);

    var date = argLength > 3 ? moment(process.argv[3]).toDate() : new Date();

    getLastGameForTeam(team.teamId, date, outputFourFactors);
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
            callback(teamGame);
        }
    });

}


function outputFourFactors(game) {
    console.log(game);
    nba.api.boxScoreFourFactors({gameId: game.gameId}).then(function(resp) {
        console.log(resp);
        var template = Handlebars.compile(fs.readFileSync('./templates/fourFactors.hbs', "utf8"));
        var data = resp.sqlTeamsFourFactors[0];
        data.opponentName = resp.sqlTeamsFourFactors[1].teamName;
        var html = template(resp.sqlTeamsFourFactors[0]);
        console.log(html);
    })
}