import React, { Component } from 'react';
import { weaponTypes, sharpness } from './weaponData';
import { BigNumber } from 'bignumber.js';
import SkillSelect from './SkillSelect';
import './App.css';

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      savedWeapons: [],
      weaponAttack: 0,
      weaponAffinity: 0,
      weaponSharpness: {
        name: 'Yellow',
        value: 1
      },
      weaponType: {
        name: 'Pick A Weapon',
        value: 1
      },
      attackBoost: {
        level: 0,
        attack: 0,
        affinity: 0
      },
      criticalEye: {
        level: 0,
        affinity: 0
      },
      weaknessExploit: {
        level: 0,
        affinity: 0
      },
      heroics: {
        level: 0,
        attackMulti: 0
      },
      trueValue: 0,
      finalValue: 0
    }

    this.handleWeaponType = this.handleSelectChange('weaponType').bind(this)
    this.handleWeaponSharpness = this.handleSelectChange('weaponSharpness').bind(this)
    this.handleAttackBoost = this.handleSelectChange('attackBoost').bind(this)
    this.handleCriticalEye = this.handleSelectChange('criticalEye').bind(this)
    this.handleWeaknessExploit = this.handleSelectChange('weaknessExploit').bind(this)
    this.handleHeroics = this.handleSelectChange('heroics').bind(this)

    this.handleWeaponAttack = this.handleInputChange('weaponAttack').bind(this)
    this.handleWeaponAffinity = this.handleInputChange('weaponAffinity').bind(this)

    this.handleSave = this.handleSave.bind(this)
    this.deleteSavedWeapon = this.deleteSavedWeapon.bind(this)
  }

  handleSelectChange (stateFieldName) {
    return (event) => {
      const newValue = JSON.parse(event.target.selectedOptions[0].dataset.value)
      this.setState(() => ({
        [stateFieldName]: newValue
      }))
      this.setState((state) => ({
        finalValue: this.calculateFinalValue(state)
      }))
    }
  }

  handleInputChange (stateFieldName) {
    return (event) => {
      const newValue = event.target.value
      this.setState(() => ({
        [stateFieldName]: Number(newValue)
      }))
      this.setState((state) => ({
        finalValue: this.calculateFinalValue(state)
      }))
    }
  }

  handleSave () {
    const newWeapon = {
      type: this.state.weaponType.name,
      trueRaw: Math.round(new BigNumber(this.state.finalValue).dividedBy(this.state.weaponType.value).toNumber()),
      gameRaw: Math.round(this.state.finalValue),
      skills: {
        attack: this.state.attackBoost.level,
        critEye: this.state.criticalEye.level,
        heroics: this.state.heroics.level,
        weaknessExploit: this.state.weaknessExploit.level
      }
    }
    this.setState((state) => ({
      savedWeapons: state.savedWeapons.concat(newWeapon)
    }))
  }

  deleteSavedWeapon (index) {
    return () => {
      this.setState((state) => ({
        savedWeapons: [...state.savedWeapons.slice(0, index), ...state.savedWeapons.slice(index+1)]
      }))
    }
  }

  calculateFinalValue (state) {
    const trueRaw = new BigNumber(state.weaponAttack).dividedBy(state.weaponType.value)
    const attackBoostedRaw = trueRaw.plus(state.attackBoost.attack)
    const heroicAttack = trueRaw.multipliedBy(state.heroics.attackMulti)
    const finalAttack = attackBoostedRaw.plus(heroicAttack)
    const affinityAsAPercent = new BigNumber(state.weaponAffinity).dividedBy(100)
    const finalAffinity = new BigNumber(state.attackBoost.affinity).plus(state.criticalEye.affinity).plus(state.weaknessExploit.affinity).plus(affinityAsAPercent)
    const absoluteAffinity = finalAffinity.abs()
    const nonAffinity = new BigNumber(1).minus(absoluteAffinity)
    const affinityMultiplier = finalAffinity > 0 ? new BigNumber(1.25) : new BigNumber(.75)
    const nonCritRaw = finalAttack.multipliedBy(nonAffinity)
    const critRaw = finalAttack.multipliedBy(affinityMultiplier).multipliedBy(absoluteAffinity)
    const calculatedRaw = nonCritRaw.plus(critRaw)
    const multipliedRaw = calculatedRaw.multipliedBy(state.weaponType.value)
    const finalValue = multipliedRaw.multipliedBy(state.weaponSharpness.value)
    console.log(`${state.weaponType.value} * ${state.weaponSharpness.value} * ((${finalAttack} * ${nonAffinity}) + (${finalAttack} * ${affinityMultiplier} * ${absoluteAffinity}))`)
    return finalValue.toNumber()
  }

  render() {
    return (
      <div className="App">
        <h1 className="app-header">Monster Hunter World Damage Calculator</h1>
        <div className="calc" style={{ display: 'flex', justifyContent: 'center'}}>
          <label>
            Weapon Type:
            <select onChange={this.handleWeaponType}>
              { weaponTypes.map(type => (<option data-value={JSON.stringify(type)} key={type.name}>{type.name}</option>)) }
            </select>
            Class Multiplier: {this.state.weaponType.value}
          </label>
          <label>
            Weapon sharpness:
            <select onChange={this.handleWeaponSharpness}>
              { sharpness.map(sharp => (<option data-value={JSON.stringify(sharp)} key={sharp.name}>{sharp.name}</option>)) }
            </select>
            Sharpness Multiplier: {this.state.weaponSharpness.value}
          </label>
          <label>
            Weapon Attack:<input onChange={this.handleWeaponAttack} type="number"/>
          </label>
          <label>
            Weapon Affinity:<input onChange={this.handleWeaponAffinity} type="number"/>
          </label>
          {Object.keys(this.props.skillData).map((skillName) => (
            <SkillSelect
              key={skillName}
              handleChange={this.handleSelectChange(skillName)}
              skillData={this.props.skillData[skillName]}
            />
          ))}
          <div className="calc-results">
            <h4>Final Weapon Attack</h4>
            <span>True Raw: {Math.round(new BigNumber(this.state.finalValue).dividedBy(this.state.weaponType.value).toNumber())}</span>
            <span>Game Raw: {Math.round(this.state.finalValue)}</span>
            <button onClick={this.handleSave}>Save For Comparison</button>
          </div>
        </div>
        
        <div className="save-table">
          <table>
            <thead>
              <tr>
                <th>Desc</th>
                <th>Weapon Type</th>
                <th>True Raw</th>
                <th>Game Raw</th>
                <th>Skills</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody className="save-table-body">
              {this.state.savedWeapons.map((weapon, i) => (
                <tr key={i} className="save-table-row">
                  <td><input/></td>
                  <td>{weapon.type}</td>
                  <td>{weapon.trueRaw}</td>
                  <td>{weapon.gameRaw}</td>
                  <td className="save-table-skill-cell">
                    <span>Attack: Lv {weapon.skills.attack}</span>
                    <span>Critical Eye: Lv {weapon.skills.critEye}</span>
                    <span>Heroics: Lv {weapon.skills.heroics}</span>
                    <span>Weakness Exploit: Lv {weapon.skills.weaknessExploit}</span>
                  </td>
                  <td>
                    <button onClick={this.deleteSavedWeapon(i)}>X</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default App;
