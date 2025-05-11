import React, { Component } from 'react'

import io from 'socket.io-client'

import TweenMax from 'gsap'

import rand_arr_elem from '../../helpers/rand_arr_elem'
import rand_to_fro from '../../helpers/rand_to_fro'

export default class SetName extends Component {

  constructor(props) {
    super(props)

    // Dynamic board
    this.rows = 4;
    this.cols = 4;

    // This isn't fully implemented
    this.amountToWin = 3;

    this.win_sets = this.createWinSets();

    if (this.props.game_type != 'live')
      this.state = {
        cell_vals: {},
        next_turn_ply: true,
        game_play: true,
        game_stat: 'Start game'
      }
    else {
      this.sock_start()

      this.state = {
        cell_vals: {},
        next_turn_ply: true,
        game_play: false,
        game_stat: 'Connecting'
      }
    }
  }


  //	------------------------	------------------------	------------------------

  componentDidMount() {
    TweenMax.from('#game_stat', 1, { display: 'none', opacity: 0, scaleX: 0, scaleY: 0, ease: Power4.easeIn });
    TweenMax.from('#game_board', 1, { display: 'none', opacity: 0, x: -200, y: -200, scaleX: 0, scaleY: 0, ease: Power4.easeIn });
  }

  //	------------------------	------------------------	------------------------

  // Dynamic Win sets
  createWinSets() {
    const rows = [...Array(this.rows).keys()];
    const cols = [...Array(this.cols).keys()];

    const output = rows.reduce((acc, rkey) => {
      const result = cols.reduce((a, ckey) => {
        const cellNum = ckey + (this.rows * rkey + 1);
        const acrossAvail = this.isOnSameRow(cellNum, cellNum + this.amountToWin - 1);
        const downAvail = this.isOnSameCol(cellNum, cellNum + (this.rows * (this.amountToWin - 1)));

        // across
        if (acrossAvail) {
          a.push([`c${cellNum}`, `c${cellNum + 1}`, `c${cellNum + 2}`]);
        }

        // down
        if (downAvail) {
          a.push([`c${cellNum}`, `c${cellNum + this.cols}`, `c${cellNum + (this.cols * 2)}`]);
        }
        // diag
        if (acrossAvail && downAvail) {
          const cell2 = cellNum + this.cols + 1;
          const cell3 = cellNum + (this.cols * 2) + 2;
          const cellRow = this.whatRow(cellNum);

          if (this.whatRow(cell2) === cellRow + 1 && this.whatRow(cell3) === cellRow + 2) {
            a.push([`c${cellNum}`, `c${cell2}`, `c${cell3}`]);
          }

        }

        // diag backwards
        if (downAvail && this.whatCol(cellNum) >= this.amountToWin) {
          console.log('diag back')
          const cell2 = cellNum + this.cols - 1
          const cell3 = cellNum + (this.cols * 2) - 2;
          const cellRow = this.whatRow(cellNum);

          console.log(cell2, cell3);
          if (this.whatRow(cell2) === cellRow + 1 && this.whatRow(cell3) === cellRow + 2) {
            a.push([`c${cellNum}`, `c${cell2}`, `c${cell3}`]);
          }

        }

        return a;

      }, []);


      if (result) {
        acc = [...acc, ...result];
      }

      return acc;

    }, [])

    return output;
  }

  isOnSameRow(cell1, cell2) {
    const output = Math.ceil(cell1 / this.cols) === Math.ceil(cell2 / this.cols);
    return output;
  }

  isOnSameCol(cell1, cell2) {
    const gameBoardSize = this.cols * this.rows;
    const output = this.whatCol(cell1) === this.whatCol(cell2) && cell2 <= gameBoardSize;
    return output;
  }

  whatRow(cell) {
    return Math.ceil(cell / this.rows);
  }

  whatCol(cell) {
    const row = this.whatRow(cell) - 1;
    return cell - (row * this.rows);
  }
  //	------------------------	------------------------	------------------------

  sock_start() {

    this.socket = io(app.settings.ws_conf.loc.SOCKET__io.u);

    this.socket.on('connect', function(data) {
      // console.log('socket connected', data)

      this.socket.emit('new player', { name: app.settings.curr_user.name });

    }.bind(this));

    this.socket.on('pair_players', function(data) {
      // console.log('paired with ', data)

      this.setState({
        next_turn_ply: data.mode == 'm',
        game_play: true,
        game_stat: 'Playing with ' + data.opp.name
      })

    }.bind(this));


    this.socket.on('opp_turn', this.turn_opp_live.bind(this));



  }

  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------

  componentWillUnmount() {

    this.socket && this.socket.disconnect();
  }

  //	------------------------	------------------------	------------------------

  cell_cont(c) {
    const { cell_vals } = this.state

    return (<div>
      {cell_vals && cell_vals[c] == 'x' && <i className="fa fa-times fa-5x"></i>}
      {cell_vals && cell_vals[c] == 'o' && <i className="fa fa-circle-o fa-5x"></i>}
    </div>)
  }

  //	------------------------	------------------------	------------------------

  render() {
    const { cell_vals } = this.state
    const rows = [...Array(this.rows).keys()];
    const cols = [...Array(this.cols).keys()];
    // console.log(cell_vals)

    return (
      <div id='GameMain'>

        <h1>Play {this.props.game_type}</h1>

        <div id="game_stat">
          <div id="game_stat_msg">{this.state.game_stat}</div>
          {this.state.game_play && <div id="game_turn_msg">{this.state.next_turn_ply ? 'Your turn' : 'Opponent turn'}</div>}
        </div>

        <div id="game_board">
          <table>
            <tbody>
              {rows.map((rkey) => {
                // Dynamic board with updated css
                return (
                  <tr key={`r-${rkey}`}>
                    {cols.map((ckey) => {
                      const cellNum = ckey + (this.rows * rkey + 1);
                      const cell = `c${cellNum}`

                      return (
                        <td key={`game_board-${cell}`} id={`game_board-${cell}`} ref={cell} onClick={this.click_cell.bind(this)}> {this.cell_cont(cell)} </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <button type='submit' onClick={this.end_game.bind(this)} className='button'><span>End Game <span className='fa fa-caret-right'></span></span></button>

      </div >
    )
  }

  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------

  click_cell(e) {
    // console.log(e.currentTarget.id.substr(11))
    // console.log(e.currentTarget)

    if (!this.state.next_turn_ply || !this.state.game_play) return

    const cell_id = e.currentTarget.id.substr(11)
    if (this.state.cell_vals[cell_id]) return

    if (this.props.game_type != 'live')
      this.turn_ply_comp(cell_id)
    else
      this.turn_ply_live(cell_id)
  }

  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------

  turn_ply_comp(cell_id) {

    let { cell_vals } = this.state

    cell_vals[cell_id] = 'x'

    TweenMax.from(this.refs[cell_id], 0.7, { opacity: 0, scaleX: 0, scaleY: 0, ease: Power4.easeOut })


    // this.setState({
    // 	cell_vals: cell_vals,
    // 	next_turn_ply: false
    // })

    // setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

    this.state.cell_vals = cell_vals

    this.check_turn()
  }

  //	------------------------	------------------------	------------------------

  turn_comp() {

    let { cell_vals } = this.state
    let empty_cells_arr = []


    for (let i = 1; i <= 9; i++)
      !cell_vals['c' + i] && empty_cells_arr.push('c' + i)
    // console.log(cell_vals, empty_cells_arr, rand_arr_elem(empty_cells_arr))

    const c = rand_arr_elem(empty_cells_arr)
    cell_vals[c] = 'o'

    TweenMax.from(this.refs[c], 0.7, { opacity: 0, scaleX: 0, scaleY: 0, ease: Power4.easeOut })


    // this.setState({
    // 	cell_vals: cell_vals,
    // 	next_turn_ply: true
    // })

    this.state.cell_vals = cell_vals

    this.check_turn()
  }


  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------

  turn_ply_live(cell_id) {

    let { cell_vals } = this.state

    cell_vals[cell_id] = 'x'

    TweenMax.from(this.refs[cell_id], 0.7, { opacity: 0, scaleX: 0, scaleY: 0, ease: Power4.easeOut })

    this.socket.emit('ply_turn', { cell_id: cell_id });

    // this.setState({
    // 	cell_vals: cell_vals,
    // 	next_turn_ply: false
    // })

    // setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

    this.state.cell_vals = cell_vals

    this.check_turn()
  }

  //	------------------------	------------------------	------------------------

  turn_opp_live(data) {

    let { cell_vals } = this.state
    let empty_cells_arr = []


    const c = data.cell_id
    cell_vals[c] = 'o'

    TweenMax.from(this.refs[c], 0.7, { opacity: 0, scaleX: 0, scaleY: 0, ease: Power4.easeOut })


    // this.setState({
    // 	cell_vals: cell_vals,
    // 	next_turn_ply: true
    // })

    this.state.cell_vals = cell_vals

    this.check_turn()
  }

  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------

  check_turn() {

    const { cell_vals } = this.state

    let win = false
    let set
    let fin = true

    if (this.props.game_type != 'live')
      this.state.game_stat = 'Play'


    for (let i = 0; !win && i < this.win_sets.length; i++) {
      set = this.win_sets[i]
      if (cell_vals[set[0]] && cell_vals[set[0]] == cell_vals[set[1]] && cell_vals[set[0]] == cell_vals[set[2]])
        win = true
    }


    for (let i = 1; i <= 9; i++)
      !cell_vals['c' + i] && (fin = false)

    // win && console.log('win set: ', set)

    if (win) {

      this.refs[set[0]].classList.add('win')
      this.refs[set[1]].classList.add('win')
      this.refs[set[2]].classList.add('win')

      TweenMax.killAll(true)
      TweenMax.from('td.win', 1, { opacity: 0, ease: Linear.easeIn })

      this.setState({
        game_stat: (cell_vals[set[0]] == 'x' ? 'You' : 'Opponent') + ' win',
        game_play: false
      })

      this.socket && this.socket.disconnect();

    } else if (fin) {

      this.setState({
        game_stat: 'Draw',
        game_play: false
      })

      this.socket && this.socket.disconnect();

    } else {
      this.props.game_type != 'live' && this.state.next_turn_ply && setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

      this.setState({
        next_turn_ply: !this.state.next_turn_ply
      })
    }

  }

  //	------------------------	------------------------	------------------------

  end_game() {
    this.socket && this.socket.disconnect();

    this.props.onEndGame()
  }



}
